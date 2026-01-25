import { prisma } from "../server/lib/prisma.js";
async function checkSupplierProfile() {
    console.log("🔍 Checking for SupplierProfile with userId 'cmi1jzxte0000ly8hhj1igvkk'...");
    const profile = await prisma.supplierProfile.findUnique({
        where: { userId: "cmi1jzxte0000ly8hhj1igvkk" },
        select: { id: true, userId: true, businessName: true, user: { select: { email: true } } },
    });
    if (profile) {
        console.log("✅ Found SupplierProfile:", profile);
    }
    else {
        console.log("❌ No SupplierProfile found for that userId.");
    }
    await prisma.$disconnect();
}
checkSupplierProfile().catch(console.error);
//# sourceMappingURL=checkSupplierProfile.js.map