// scripts/fixSupplierService.ts
import { prisma } from "../server/lib/prisma.js";
async function main() {
    console.log("🔧 Fixing SupplierService table...");
    // 1️⃣ Find all supplier profiles (so we can get the correct userId)
    const suppliers = await prisma.supplierProfile.findMany({
        select: { id: true, userId: true, businessName: true },
    });
    if (suppliers.length === 0) {
        console.log("⚠️ No SupplierProfiles found. Please create one in Prisma Studio first.");
        return;
    }
    console.table(suppliers);
    // 2️⃣ Fix each SupplierService individually
    for (const supplier of suppliers) {
        // Find all SupplierServices that still use the old supplierId (the profile id)
        const oldRecords = await prisma.supplierService.findMany({
            where: { supplierId: supplier.id },
        });
        for (const old of oldRecords) {
            console.log(`🔄 Updating SupplierService ${old.id}...`);
            await prisma.supplierService.update({
                where: { id: old.id },
                data: { supplierId: supplier.userId },
            });
            console.log(`✅ Updated service ${old.id} to supplierId ${supplier.userId}`);
        }
    }
    // 3️⃣ Verify results
    const updated = await prisma.supplierService.findMany({
        select: { id: true, supplierId: true, service: true },
    });
    console.table(updated);
    console.log("🎉 SupplierService repair completed successfully!");
}
main()
    .catch((e) => {
    console.error("❌ Error running fix script:", e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=fixSupplierService.js.map