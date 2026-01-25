import { prisma } from "../server/lib/prisma";
async function checkOwnerAndDog() {
    console.log("🔍 Checking OwnerProfile and Dog setup...");
    const user = await prisma.user.upsert({
        where: { id: "test_owner_123" },
        update: {},
        create: {
            id: "test_owner_123",
            role: "OWNER",
            firstName: "Test",
            lastName: "Owner",
            email: "owner@example.com",
            mobilePhone: "555-1234",
        },
    });
    console.log("✅ User ready:", user.email);
    const ownerProfile = await prisma.ownerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            emergencyContact: "555-1234",
            notes: "Test owner for dog relation check",
        },
        include: { user: true },
    });
    console.log("✅ OwnerProfile ready for:", ownerProfile.user.email);
    const dog = await prisma.dog.upsert({
        where: { id: "test_dog_123" },
        update: {},
        create: {
            id: "test_dog_123",
            ownerId: ownerProfile.userId,
            name: "Buddy",
            breed: "Labrador",
            gender: "Male",
            spayedNeutered: false,
            vaccinationUpToDate: true,
        },
        include: { owner: { include: { user: true } } },
    });
    console.log(`🐶 Dog ready: ${dog.name} (Owner: ${dog.owner.user.firstName})`);
    const ownerWithDogs = await prisma.ownerProfile.findUnique({
        where: { userId: user.id },
        include: { dogs: true, user: true },
    });
    console.log("📋 Owner now has dogs:", ownerWithDogs?.dogs.map((d) => d.name));
    console.log("✅ Owner ↔ Dog linkage test complete!");
    await prisma.$disconnect();
}
checkOwnerAndDog().catch(async (err) => {
    console.error("❌ Error in checkOwnerAndDog:", err);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=checkOwnerAndDog.js.map