import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

/* ================================
   TYPES
================================ */

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "COMPLETED_UNBILLED"
  | "PAID"
  | "CANCELLED";

type Booking = {
  id: string;
  status: BookingStatus;
  serviceType?: string;
  startAt?: string;
  suburb?: string;
};

/* ================================
   HELPERS
================================ */

function formatService(service?: string) {
  if (!service) return "Service";

  const map: Record<string, string> = {
    WALKING: "🐕 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
  };

  return map[service] ?? service;
}

/* ================================
   COMPONENT
================================ */

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  /* ================================
     FETCH DATA
  ================================ */

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => {
      const res = await api.get("/supplier/profile");
      return res.data;
    },
  });

  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => {
      const res = await api.get("/supplier/bookings");
      return res.data;
    },
  });

  /* ================================
     MUTATIONS
  ================================ */

  const bookingAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return api.patch(`/supplier/bookings/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-bookings"] });
    },
  });

  /* ================================
     DATA
  ================================ */

  const profile = profileData?.profile ?? {};
  const bookings: Booking[] = bookingsData?.bookings ?? [];

  const pending = bookings.filter((b) => b.status === "PENDING");
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");

  if (isProfileLoading || isBookingsLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-3xl font-semibold">
        Welcome {profile.businessName || "Supplier"}
      </h1>

      {/* ================= PROFILE ================= */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Business Profile</h2>
        <p><strong>Name:</strong> {profile.businessName || "—"}</p>
        <p><strong>Email:</strong> {profile.contactEmail || "—"}</p>
        <p><strong>Phone:</strong> {profile.contactPhone || "—"}</p>
      </div>

      {/* ================= BOOKINGS ================= */}
      <div className="space-y-6">

        {/* PENDING */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Pending Bookings</h2>

          {pending.length === 0 && <p>No pending bookings</p>}

          {pending.map((b) => (
            <div key={b.id} className="border p-3 rounded mb-2">
              <p>{formatService(b.serviceType)}</p>
              <p>{b.suburb}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() =>
                    bookingAction.mutate({ id: b.id, action: "accept" })
                  }
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    bookingAction.mutate({ id: b.id, action: "decline" })
                  }
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CONFIRMED */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Confirmed Bookings</h2>

          {confirmed.length === 0 && <p>No confirmed bookings</p>}

          {confirmed.map((b) => (
            <div key={b.id} className="border p-3 rounded mb-2">
              <p>{formatService(b.serviceType)}</p>
              <p>{b.suburb}</p>

              <button
                onClick={() =>
                  bookingAction.mutate({ id: b.id, action: "start" })
                }
                className="bg-blue-600 text-white px-3 py-1 rounded mt-2"
              >
                Start Job
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}