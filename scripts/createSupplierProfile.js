import { prisma } from "../server/lib/prisma.js";
async function createSupplierProfile() {
    console.log("🧩 Creating SupplierProfile for userId 'cmi1jzxte0000ly8hhj1igvkk'...");
    try {
        const profile = await prisma.supplierProfile.create({
            data: {
                userId: "cmi1jzxte0000ly8hhj1igvkk",
                businessName: "Pawfect Grooming",
                businessAddress: "123 Doggo Lane",
                businessPhone: "0123456789",
                websiteUrl: "https://pawfectgrooming.example.com",
                aboutServices: "Professional dog grooming services.",
            },
        });
        console.log("✅ SupplierProfile successfully created:");
        console.log(profile);
    }
    catch (err) {
        console.error("❌ Error creating SupplierProfile:", err);
    }
    finally {
        await prisma.$disconnect();
    }
}
createSupplierProfile();
//# sourceMappingURL=createSupplierProfile.js.map