import { prisma } from "../server/lib/prisma.js";
async function createUser() {
    const userId = "cmi1jzxte0000ly8hhj1igvkk";
    console.log(`🧩 Creating User with id '${userId}'...`);
    const user = await prisma.user.create({
        data: {
            id: userId,
            role: "SUPPLIER",
            firstName: "Hayley",
            lastName: "Lambert",
            email: "supplier2@example.com",
            mobilePhone: "0123456789",
        },
    });
    console.log("✅ User created successfully:", user);
    await prisma.$disconnect();
}
createUser().catch(console.error);
//# sourceMappingURL=createUser.js.map