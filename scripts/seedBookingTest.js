import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function upsertUser(email, firstName, lastName, role) {
    return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            firstName,
            lastName,
            mobilePhone: "0000000000",
            role, // "OWNER" | "SUPPLIER"
            marketingOptIn: true,
            remindersOptIn: true,
        },
    });
}
async function main() {
    // --- Users
    const supplierUser = await upsertUser("supplier@test.com", "Test", "Supplier", "SUPPLIER");
    const ownerUser = await upsertUser("owner@test.com", "Test", "Owner", "OWNER");
    // --- SupplierProfile (links to supplier user)
    const supplierProfile = await prisma.supplierProfile.upsert({
        where: { userId: supplierUser.id },
        update: {},
        create: {
            userId: supplierUser.id,
            businessName: "Seeded Supplier",
            businessAddress: "123 Seed St",
        },
    });
    // --- SupplierService: use string literals for enums
    await prisma.supplierService.upsert({
        where: {
            supplierId_service: {
                supplierId: supplierProfile.id,
                service: "WALKING", // ServiceType
            },
        },
        update: {},
        create: {
            supplierId: supplierProfile.id, // SupplierProfile.id
            service: "WALKING", // ServiceType
            unit: "PER_WALK", // SupplierUnit
            baseRateCents: 25000,
            durationMinutes: 60,
            isActive: true,
        },
    });
    // --- Create an AVAILABLE slot on SupplierProfile
    const now = new Date();
    const startAt = new Date(now.getTime() + 60 * 60 * 1000); // +1h
    const endAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h
    const slot = await prisma.bookingSlot.create({
        data: {
            supplierId: supplierProfile.id, // SupplierProfile.id
            startAt,
            endAt,
            status: "AVAILABLE", // SlotStatus
            serviceType: "WALKING", // ServiceType
        },
    });
    // --- Booking linked to that slot (supplier/owner are User ids)
    const booking = await prisma.booking.create({
        data: {
            ownerId: ownerUser.id, // User.id (owner)
            supplierId: supplierUser.id, // User.id (supplier)
            serviceType: "WALKING", // ServiceType
            startAt,
            endAt,
            totalCents: 25000,
            slotId: slot.id, // 1:1 link
            status: "PENDING", // BookingStatus
        },
    });
    // Optionally flip slot to BOOKED (mimic app)
    await prisma.bookingSlot.update({
        where: { id: slot.id },
        data: { status: "BOOKED" }, // SlotStatus
    });
    console.log("✅ Seeded test data:", { user_owner: ownerUser.id, user_supplier: supplierUser.id, slot: slot.id, booking: booking.id });
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seedBookingTest.js.map