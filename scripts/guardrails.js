import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function exec(sql, label) {
    await prisma.$executeRawUnsafe(sql);
    console.log('✔', label);
}
async function run() {
    // 1) Ensure columns exist
    await exec(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='Booking' AND column_name='totalCents'
  ) THEN
    ALTER TABLE "public"."Booking" ADD COLUMN "totalCents" INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='Booking' AND column_name='supplierServiceId'
  ) THEN
    ALTER TABLE "public"."Booking" ADD COLUMN "supplierServiceId" TEXT;
  END IF;
END$$;
  `, 'ensure columns');
    // 2) Backfill total -> totalCents (if old "total" exists)
    await exec(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='Booking' AND column_name='total'
  ) THEN
    UPDATE "public"."Booking"
       SET "totalCents" = CASE 
         WHEN "total" IS NULL THEN NULL 
         ELSE ROUND("total" * 100)::INT 
       END
     WHERE "totalCents" IS NULL;
    -- Optional: drop old float column:
    -- ALTER TABLE "public"."Booking" DROP COLUMN "total";
  END IF;
END$$;
  `, 'backfill totalCents');
    // 3) Backfill supplierServiceId using explicit target alias (b)
    await exec(`
WITH preferred_service AS (
  SELECT ss."id" AS service_id,
         ss."supplierId" AS supplier_profile_id,
         ss."service" AS service_type,
         ROW_NUMBER() OVER (
           PARTITION BY ss."supplierId", ss."service"
           ORDER BY (CASE WHEN ss."isActive" THEN 0 ELSE 1 END), ss."createdAt"
         ) AS rn
  FROM "public"."SupplierService" ss
)
UPDATE "public"."Booking" AS b
SET "supplierServiceId" = ps.service_id
FROM "public"."User" su
JOIN "public"."Supplier" sp
  ON sp."userId" = su."id"
JOIN preferred_service ps
  ON ps.supplier_profile_id = sp."id"
 AND ps.rn = 1
WHERE b."supplierId" = su."id"
  AND b."serviceType" = ps.service_type
  AND b."supplierServiceId" IS NULL;
  `, 'backfill supplierServiceId');
    // 4) Add index + FK if missing
    await exec(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='Booking' AND indexname='Booking_supplierServiceId_idx'
  ) THEN
    CREATE INDEX "Booking_supplierServiceId_idx" ON "public"."Booking" ("supplierServiceId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
   WHERE tc.table_schema='public' 
     AND tc.table_name='Booking' 
     AND tc.constraint_type='FOREIGN KEY'
     AND kcu.column_name='supplierServiceId'
  ) THEN
    ALTER TABLE "public"."Booking"
      ADD CONSTRAINT "Booking_supplierServiceId_fkey"
      FOREIGN KEY ("supplierServiceId")
      REFERENCES "public"."SupplierService"("id")
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;
  `, 'index + FK');
}
run()
    .then(() => console.log('✅ Guard-rails applied'))
    .catch((e) => { console.error('❌', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=guardrails.js.map