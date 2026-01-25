import { prisma } from "../server/lib/prisma.js";
async function fixSupplierId() {
    console.log("🔧 Fixing supplierId for SupplierService and Booking...");
    const oldSupplierId = "test_supplier_123"; // old test ID
    const newSupplierId = "cmzi16jg0000pgisxnuztwo9"; // your real supplier ID
    // ✅ Update SupplierService table
    const supplierServiceResult = await prisma.$executeRawUnsafe(`
    UPDATE "SupplierService"
    SET "supplierId" = '${newSupplierId}'
    WHERE "supplierId" = '${oldSupplierId}';
  `);
    // ✅ Update Booking table
    const bookingResult = await prisma.$executeRawUnsafe(`
    UPDATE "Booking"
    SET "supplierId" = '${newSupplierId}'
    WHERE "supplierId" = '${oldSupplierId}';
  `);
    console.log("✅ Updates complete:");
    console.log("  SupplierService rows affected:", supplierServiceResult);
    console.log("  Booking rows affected:", bookingResult);
    await prisma.$disconnect();
}
fixSupplierId()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=fixSupplierId.js.map