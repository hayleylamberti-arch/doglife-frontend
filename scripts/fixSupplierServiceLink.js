import { prisma } from "../server/lib/prisma.js";
async function fixSupplierServiceLink() {
    console.log("🔧 Fixing SupplierService link...");
    // ✅ Step 1: Identify the supplier user
    const supplierUserId = "cmi1jzxte0000ly8hhj1igvkk"; // Hayley Lambert
    // ✅ Step 2: Look up the SupplierProfile automatically
    const profile = await prisma.supplierProfile.findUnique({
        where: { userId: supplierUserId },
    });
    if (!profile) {
        console.error("❌ SupplierProfile not found for userId:", supplierUserId);
        console.error("Run ensureSupplierSetup.ts first.");
        await prisma.$disconnect();
        return;
    }
    console.log(`✅ Found SupplierProfile: ${profile.businessName} (${profile.id})`);
    // ✅ Step 3: Find SupplierService rows linked to the wrong supplierId
    const oldServices = await prisma.supplierService.findMany({
        where: {
            supplierId: { not: supplierUserId },
        },
        select: {
            id: true,
            supplierId: true,
            service: true,
        },
    });
    if (oldServices.length === 0) {
        console.log("✅ No mismatched SupplierService entries found. All good!");
        await prisma.$disconnect();
        return;
    }
    console.log(`⚠️ Found ${oldServices.length} service(s) with incorrect supplierId:`);
    console.table(oldServices);
    // ✅ Step 4: Fix them
    for (const service of oldServices) {
        console.log(`➡️ Fixing ${service.service} (id: ${service.id})...`);
        await prisma.supplierService.update({
            where: { id: service.id },
            data: { supplierId: profile.id },
        });
    }
    console.log("✅ All SupplierService entries have been fixed!");
    await prisma.$disconnect();
}
fixSupplierServiceLink().catch((err) => {
    console.error("❌ Error in fixSupplierServiceLink:", err);
    process.exit(1);
});
//# sourceMappingURL=fixSupplierServiceLink.js.map