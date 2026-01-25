import { prisma } from "../lib/prisma.js";
async function verifySupplierLinks() {
    console.log("🔍 Verifying supplier links...\n");
    const supplierId = "cmzi16jg0000pgisxnuztwo9"; // your current supplier ID
    const bookings = await prisma.booking.findMany({
        select: { id: true, ownerId: true, supplierId: true, status: true }
    });
    for (const booking of bookings) {
        console.log(`Booking ${booking.id} | owner: ${booking.ownerId} | supplier: ${booking.supplierId} | status: ${booking.status}`);
        if (booking.supplierId !== supplierId) {
            console.log("❌ Supplier mismatch for booking:", booking.id);
        }
        else {
            console.log("✅ Supplier matches");
        }
    }
    await prisma.$disconnect();
}
verifySupplierLinks().catch(console.error);
//# sourceMappingURL=verifySupplierLinks.js.map