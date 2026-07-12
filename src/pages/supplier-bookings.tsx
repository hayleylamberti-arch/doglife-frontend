import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

import type { SupplierBooking } from "@/types/bookings";

function yesNo(value?: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not provided";
}

function formatDate(value?: string | null) {
  if (!value) return "Not provided";

  return new Date(value).toLocaleDateString("en-ZA");
}

function formatServiceName(value?: string | null) {
  const serviceMap: Record<string, string> = {
    WALKING: "Dog Walking",
    TRAINING: "Dog Training",
    GROOMING: "Dog Grooming",
    BOARDING: "Dog Boarding",
    DAYCARE: "Doggy Daycare",
    PET_SITTING: "Pet Sitting",
    PET_TRANSPORT: "Pet Transport",
    MOBILE_VET: "Mobile Vet",
  };

  if (!value) return "Booking";

  return (
    serviceMap[value] ||
    value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function formatStatus(value?: string | null) {
  const statusMap: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In Progress",
    COMPLETED_UNBILLED: "Awaiting Payment",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  if (!value) return "Unknown";

  return statusMap[value] || value;
}

export default function SupplierBookings() {
  const [alternativeMessages, setAlternativeMessages] = useState<
    Record<string, string>
  >({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => {
      const response = await api.get("/api/supplier/bookings");
      return response.data;
    },
  });

  const bookings: SupplierBooking[] = Array.isArray(data?.bookings)
    ? data.bookings
    : [];

  async function acceptBooking(id: string) {
    await api.patch(`/api/supplier/bookings/${id}/accept`);

    trackEvent("booking_confirmed", {
      bookingId: id,
      actor: "supplier",
    });

    await refetch();
  }

  async function markUnavailable(id: string) {
    const message = alternativeMessages[id]?.trim();

    await api.patch(`/api/supplier/bookings/${id}/decline`, {
      message: message || undefined,
    });

    trackEvent("booking_unavailable", {
      bookingId: id,
      actor: "supplier",
      hasAlternativeSuggestion: Boolean(message),
    });

    await refetch();
  }

  if (isLoading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Booking Requests</h1>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No booking requests yet.</p>
      ) : null}

      {bookings.map((booking) => (
        <div key={booking.id} className="rounded-xl border bg-white p-5">
          <div className="flex justify-between gap-4">
            <div>
              <p className="font-medium">
                {formatServiceName(booking.serviceType)}
              </p>

              <p className="text-sm text-gray-500">
                {new Date(booking.startAt).toLocaleString("en-ZA")} –{" "}
                {new Date(booking.endAt).toLocaleString("en-ZA")}
              </p>

              <p className="text-sm text-gray-500">
                Status: {formatStatus(booking.status)}
              </p>

              {booking.owner ? (
                <p className="mt-2 text-sm">
                  Owner: {booking.owner.firstName || "Owner"}
                  {booking.owner.lastName
                    ? ` ${booking.owner.lastName}`
                    : ""}
                </p>
              ) : null}
            </div>

            {booking.status === "PENDING" ? (
              <div className="flex max-w-sm flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptBooking(booking.id)}
                    className="rounded-md bg-green-600 px-4 py-2 text-white"
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() => markUnavailable(booking.id)}
                    className="rounded-md bg-red-600 px-4 py-2 text-white"
                  >
                    Mark as unavailable
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Suggest an alternative time (optional)
                  </label>

                  <p className="mt-1 text-xs text-gray-500">
                    If you can’t accept this exact request, suggest another time
                    before marking it unavailable.
                  </p>

                  <textarea
                    value={alternativeMessages[booking.id] || ""}
                    onChange={(event) =>
                      setAlternativeMessages((current) => ({
                        ...current,
                        [booking.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="Example: I’m available tomorrow at 2pm or Thursday morning."
                  />
                </div>
              </div>
            ) : null}
          </div>

          {booking.accessInstructions ? (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Access instructions
              </p>

              <p className="mt-2 whitespace-pre-line text-sm text-blue-800">
                {booking.accessInstructions}
              </p>

              {booking.accessInstructionsUpdatedAt ? (
                <p className="mt-2 text-xs text-blue-600">
                  Updated:{" "}
                  {new Date(
                    booking.accessInstructionsUpdatedAt
                  ).toLocaleString("en-ZA")}
                </p>
              ) : null}
            </div>
          ) : null}

          {booking.dogs?.length ? (
            <div className="mt-5 space-y-3">
              <h2 className="font-semibold">Dog health &amp; behaviour</h2>

              {booking.dogs.map((bookingDog) => {
                const dog = bookingDog.dog;

                if (!dog) return null;

                return (
                  <div
                    key={dog.id}
                    className="rounded-lg border bg-gray-50 p-4"
                  >
                    <p className="font-medium">
                      {dog.name}
                      {dog.breed ? ` • ${dog.breed}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                      <p>Size: {dog.size || "Not provided"}</p>
                      <p>Sex: {dog.sex || "Not provided"}</p>
                      <p>Neutered: {yesNo(dog.isNeutered)}</p>
                      <p>Vaccinated: {yesNo(dog.isVaccinated)}</p>

                      {booking.status !== "PENDING" ? (
                        <>
                          <p>
                            Vaccination expiry:{" "}
                            {formatDate(dog.vaccinationExpiryDate)}
                          </p>
                          <p>
                            Kennel cough: {formatDate(dog.kennelCoughAt)}
                          </p>
                          <p>Dewormed: {formatDate(dog.dewormedAt)}</p>
                          <p>
                            Tick/flea treated:{" "}
                            {formatDate(dog.tickFleaTreatedAt)}
                          </p>
                          <p>
                            Vet name: {dog.vetName || "Not provided"}
                          </p>
                          <p>
                            Vet phone: {dog.vetPhone || "Not provided"}
                          </p>
                        </>
                      ) : null}

                      <p>Good with dogs: {yesNo(dog.goodWithDogs)}</p>
                      <p>
                        Good with children: {yesNo(dog.goodWithChildren)}
                      </p>
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