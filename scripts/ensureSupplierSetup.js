import { prisma } from "../server/lib/prisma.js";
async function ensureSupplierSetup() {
    const userId = "cmi1jzxte0000ly8hhj1igvkk";
    const userEmail = "supplier2@example.com";
    console.log("🔍 Checking Supplier setup for:", userId);
    // 1️⃣ Check or create USER
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.log("⚠️ User not found — creating new user...");
        user = await prisma.user.create({
            data: {
                id: userId,
                role: "SUPPLIER",
                firstName: "Hayley",
                lastName: "Lambert",
                email: userEmail,
                mobilePhone: "0123456789",
            },
        });
        console.log("✅ User created:", user.email);
    }
    else {
        console.log("✅ User exists:", user.email);
    }
    // 2️⃣ Check or create SUPPLIER PROFILE
    let profile = await prisma.supplierProfile.findUnique({
        where: { userId },
    });
    if (!profile) {
        console.log("⚠️ SupplierProfile not found — creating new one...");
        profile = await prisma.supplierProfile.create({
            data: {
                userId,
                businessName: "Pawfect Grooming",
                businessAddress: "123 Doggo Lane",
                businessPhone: "0123456789",
                servicesOffered: "Professional dog grooming services.",
                aboutServices: "We offer full grooming, wash, and nail trim packages.",
                websiteUrl: "https://pawfectgrooming.example.com",
            },
        });
        console.log("✅ SupplierProfile created:", profile.businessName);
    }
    else {
        console.log("✅ SupplierProfile exists:", profile.businessName);
    }
    console.log("\n🎉 Setup complete!");
    await prisma.$disconnect();
}
ensureSupplierSetup().catch((err) => {
    console.error("❌ Error in ensureSupplierSetup:", err);
    process.exit(1);
});
//# sourceMappingURL=ensureSupplierSetup.js.map