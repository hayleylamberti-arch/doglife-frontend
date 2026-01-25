import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // Counts
    const [missingSvc, missingTotals] = await Promise.all([
        prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "public"."Booking" WHERE "supplierServiceId" IS NULL`),
        prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "public"."Booking" WHERE "totalCents" IS NULL`),
    ]);
    // Distribution by service type
    const bookingsBySvc = await prisma.$queryRawUnsafe(`SELECT "serviceType", COUNT(*)::text AS cnt
     FROM "public"."Booking"
     GROUP BY 1
     ORDER BY 2::int DESC`);
    // Check FK exists
    const fkCheck = await prisma.$queryRawUnsafe(`SELECT EXISTS (
       SELECT 1
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema='public'
         AND tc.table_name='Booking'
         AND tc.constraint_type='FOREIGN KEY'
         AND kcu.column_name='supplierServiceId'
     ) AS exists`);
    console.log('---- Guard-rail sanity check ----');
    console.log('Missing supplierServiceId:', missingSvc[0]?.count ?? '0');
    console.log('Missing totalCents:', missingTotals[0]?.count ?? '0');
    console.log('FK Booking->SupplierService present:', fkCheck[0]?.exists ? 'yes' : 'no');
    console.table(bookingsBySvc);
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=checks.js.map