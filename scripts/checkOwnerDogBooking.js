import { prisma } from "../server/lib/prisma";
async function checkOwnerDogBooking() {
    console.log("🔍 Starting Owner → Dog → Booking test...");
    // Step 1️⃣ Ensure owner exists (from previous test)
    const owner = await prisma.user.upsert({
        where: { id: "test_owner_123" },
        update: {},
        create: {
            id: "test_owner_123",
            role: "OWNER",
            firstName: "Test",
            lastName: "Owner",
            email: "owner@example.com",
        },
    });
    // Step 2️⃣ Ensure supplier exists
    const supplier = await prisma.user.upsert({
        where: { id: "test_supplier_123" },
        update: {},
        create: {
            id: "test_supplier_123",
            role: "SUPPLIER",
            firstName: "Test",
            lastName: "Supplier",
            email: "supplier@example.com",
        },
    });
    // Ensure supplier profile exists
    const supplierProfile = await prisma.supplierProfile.upsert({
        where: { userId: supplier.id },
        update: {},
        create: {
            userId: supplier.id,
            businessName: "Buddy Walks",
            businessPhone: "555-6789",
            aboutServices: "Test supplier for booking linkage",
        },
        include: { user: true },
    });
    // Step 3️⃣ Fetch existing dog (Buddy)
    const dog = await prisma.dog.findUnique({
        where: { id: "test_dog_123" },
    });
    if (!dog)
        throw new Error("❌ Dog 'test_dog_123' not found. Run checkOwnerAndDog.ts first.");
    // Step 4️⃣ Create Booking
    const booking = await prisma.booking.upsert({
        where: { id: "test_booking_123" },
        update: {},
        create: {
            id: "test_booking_123",
            ownerId: owner.id,
            supplierId: supplier.id,
            serviceType: "WALKING",
            startAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
            endAt: new Date(Date.now() + 7200 * 1000), // 2 hours from now
            notes: "Test booking for owner/dog linkage",
            totalCents: 2000,
        },
        include: { owner: true, supplier: true },
    });
    console.log(`📅 Booking created: ${booking.id} (${booking.serviceType})`);
    // Step 5️⃣ Link Dog via BookingDog join
    const bookingDog = await prisma.bookingDog.upsert({
        where: {
            bookingId_dogId: {
                bookingId: booking.id,
                dogId: dog.id,
            },
        },
        update: {},
        create: {
            bookingId: booking.id,
            dogId: dog.id,
        },
    });
    console.log(`🐕 Linked dog '${dog.name}' to booking '${booking.id}'`);
    // Step 6️⃣ Fetch back full booking details
    const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
            owner: true,
            supplier: true,
            dogs: {
                include: { dog: true },
            },
        },
    });
    console.log("✅ Booking ready:");
    console.log({
        owner: `${fullBooking?.owner.firstName} ${fullBooking?.owner.lastName}`,
        supplier: `${fullBooking?.supplier.firstName} ${fullBooking?.supplier.lastName}`,
        dogs: fullBooking?.dogs.map((d) => d.dog.name),
        status: fullBooking?.status,
    });
    console.log("✅ Owner → Dog → Booking linkage test complete!");
    await prisma.$disconnect();
}
checkOwnerDogBooking().catch(async (err) => {
    console.error("❌ Error in checkOwnerDogBooking:", err);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=checkOwnerDogBooking.js.map