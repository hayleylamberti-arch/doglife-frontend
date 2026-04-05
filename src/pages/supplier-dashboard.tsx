import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

/* =========================
   HELPERS
========================= */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "COMPLETED":
    case "COMPLETED_UNBILLED":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  const prevBookingCount = useRef(0);
  const hasPlayedSound = useRef(false);

  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(15);

  /* =========================
     FETCH BOOKINGS
  ========================= */

  const { data = [], isLoading } = useQuery({
    queryKey: ["supplierBookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data.bookings || [];
    },
    refetchInterval: 5000,
  });

  /* =========================
     SORT BOOKINGS (NEWEST FIRST)
  ========================= */

  const sortedBookings = [...data].sort(
    (a: any, b: any) =>
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );

  /* =========================
     UBER-STYLE ALERT SYSTEM
  ========================= */

  useEffect(() => {
    const pending = sortedBookings.filter(
      (b: any) => b.status === "PENDING"
    );

    if (pending.length > prevBookingCount.current) {
      const newest = pending[0];

      setActiveAlert(newest);
      setCountdown(15);

      // 🔔 SOUND (play once per alert)
      if (!hasPlayedSound.current) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
        hasPlayedSound.current = true;
      }

      // 📳 VIBRATION
      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
    }

    prevBookingCount.current = pending.length;
  }, [sortedBookings]);

  /* =========================
     COUNTDOWN TIMER
  ========================= */

  useEffect(() => {
    if (!activeAlert) {
      hasPlayedSound.current = false;
      return;
    }

    if (countdown <= 0) {
      setActiveAlert(null);
      hasPlayedSound.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, activeAlert]);

  /* =========================
     ACTIONS
  ========================= */

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/accept`);
    },
    onSuccess: () => {
      setActiveAlert(null);
      hasPlayedSound.current = false;
      queryClient.invalidateQueries({ queryKey: ["supplierBookings"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      setActiveAlert(null);
      hasPlayedSound.current = false;
      queryClient.invalidateQueries({ queryKey: ["supplierBookings"] });
    },
  });

  /* =========================
     BOOKING CARD
  ========================= */

  const renderCard = (booking: any) => (
    <div
      key={booking.id}
      className="p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="flex justify-between">

        {/* LEFT */}
        <div className="space-y-2">
          <p className="font-semibold text-lg text-gray-900">
            {booking.owner?.firstName} {booking.owner?.lastName}
          </p>

          <p className="text-sm text-gray-500">
            {formatDate(booking.startAt)} •{" "}
            {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
          </p>

          <p className="text-xs uppercase text-gray-600">
            {booking.supplierService?.service || booking.serviceType}
          </p>

          <p className="text-sm text-gray-700">
            🐶{" "}
            {booking.dogs?.length
              ? booking.dogs.map((d: any) => d.dog.name).join(", ")
              : "No dogs"}
          </p>
        </div>

        {/* RIGHT */}
        <div className="text-right space-y-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
              booking.status
            )}`}
          >
            {booking.status}
          </span>

          <p className="font-semibold text-gray-900">
            {formatPrice(booking.totalCents)}
          </p>

          {booking.status === "PENDING" && (
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => acceptMutation.mutate(booking.id)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                Accept
              </button>

              <button
                onClick={() => declineMutation.mutate(booking.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* =========================
     UI
  ========================= */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <h1 className="text-3xl font-bold">Supplier Dashboard</h1>

      {/* 🚨 ALERT */}
      {activeAlert && (
        <div className="fixed bottom-6 left-6 right-6 z-50 bg-black text-white p-5 rounded-2xl shadow-2xl">

          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">
                🚨 New Booking Request
              </p>
              <p className="text-sm opacity-80">
                {activeAlert.owner?.firstName} •{" "}
                {formatTime(activeAlert.startAt)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold">{countdown}s</p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => acceptMutation.mutate(activeAlert.id)}
              className="flex-1 bg-green-500 py-3 rounded-xl font-semibold"
            >
              Accept
            </button>

            <button
              onClick={() => declineMutation.mutate(activeAlert.id)}
              className="flex-1 bg-red-500 py-3 rounded-xl font-semibold"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* BOOKINGS */}
      {isLoading && <p>Loading bookings...</p>}

      {!isLoading && sortedBookings.length === 0 && (
        <p className="text-gray-500">No bookings yet</p>
      )}

      <div className="space-y-4">
        {sortedBookings.map((b: any) => renderCard(b))}
      </div>

    </div>
  );
}