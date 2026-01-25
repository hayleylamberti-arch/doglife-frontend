import { prisma } from "../server/lib/prisma.js";
async function checkUser() {
    const userId = "cmi1jzxte0000ly8hhj1igvkk";
    console.log(`🔍 Checking if User exists with id '${userId}'...`);
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
    });
    if (user) {
        console.log("✅ Found User:", user);
    }
    else {
        console.log("❌ No User found with that id.");
    }
    await prisma.$disconnect();
}
checkUser().catch(console.error);
//# sourceMappingURL=checkUser.js.map