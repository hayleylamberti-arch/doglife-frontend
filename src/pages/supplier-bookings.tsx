import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

function yesNo(value?: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not provided";
}

function formatDate(value?: string | null) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString("en-ZA");
}

export default function SupplierBookings() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  const bookings = data?.bookings || [];

  async function acceptBooking(id: string) {
    await api.patch(`/api/supplier/bookings/${id}/accept`);

    trackEvent("booking_confirmed", {
      bookingId: id,
      actor: "supplier",
    });

    refetch();
  }

  async function declineBooking(id: string) {
    await api.patch(`/api/supplier/bookings/${id}/decline`);

    trackEvent("booking_cancelled", {
      bookingId: id,
      actor: "supplier",
      reason: "supplier_declined",
    });

    refetch();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Booking Requests</h1>

      {bookings.length === 0 && (
        <p className="text-muted-foreground">No booking requests yet.</p>
      )}

      {bookings.map((booking: any) => (
        <div key={booking.id} className="rounded-xl border bg-white p-5">
          <div className="flex justify-between gap-4">
            <div>
              <p className="font-medium">{booking.serviceType}</p>

              <p className="text-sm text-gray-500">
                {new Date(booking.startAt).toLocaleString("en-ZA")} -{" "}
                {new Date(booking.endAt).toLocaleString("en-ZA")}
              </p>

              <p className="text-sm text-gray-500">Status: {booking.status}</p>

              {booking.owner ? (
                <p className="mt-2 text-sm">
                  Owner: {booking.owner.firstName} {booking.owner.lastName}
                </p>
              ) : null}
            </div>

            {booking.status === "PENDING" && (
              <div className="flex gap-2">
                <button
                  onClick={() => acceptBooking(booking.id)}
                  className="rounded-md bg-green-600 px-4 py-2 text-white"
                >
                  Accept
                </button>

                <button
                  onClick={() => declineBooking(booking.id)}
                  className="rounded-md bg-red-600 px-4 py-2 text-white"
                >
                  Decline
                </button>
              </div>
            )}
          </div>

          {booking.dogs?.length ? (
            <div className="mt-5 space-y-3">
              <h2 className="font-semibold">Dog health & behaviour</h2>

              {booking.dogs.map((bookingDog: any) => {
                const dog = bookingDog.dog;

                return (
                  <div key={dog.id} className="rounded-lg border bg-gray-50 p-4">
                    <p className="font-medium">
                      {dog.name}
                      {dog.breed ? ` • ${dog.breed}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <p>Size: {dog.size || "Not provided"}</p>
                      <p>Sex: {dog.sex || "Not provided"}</p>
                      <p>Neutered: {yesNo(dog.isNeutered)}</p>
                      <p>Vaccinated: {yesNo(dog.isVaccinated)}</p>
                      <p>Vaccination expiry: {formatDate(dog.vaccinationExpiryDate)}</p>
                      <p>Kennel cough: {formatDate(dog.kennelCoughAt)}</p>
                      <p>Dewormed: {formatDate(dog.dewormedAt)}</p>
                      <p>Tick/flea treated: {formatDate(dog.tickFleaTreatedAt)}</p>
                      <p>Good with dogs: {yesNo(dog.goodWithDogs)}</p>
                      <p>Good with children: {yesNo(dog.goodWithChildren)}</p>
                      <p>Vet name: {dog.vetName || "Not provided"}</p>
                      <p>Vet phone: {dog.vetPhone || "Not provided"}</p>
                    </div>

                    {dog.behavioralNotes ? (
                      <p className="mt-3 text-sm">
                        Behaviour notes: {dog.behavioralNotes}
                      </p>
                    ) : null}

                    {dog.medicalNotes ? (
                      <p className="mt-2 text-sm">
                        Medical notes: {dog.medicalNotes}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}