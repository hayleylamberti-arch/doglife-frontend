import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export default function Dashboard() {
  const queryClient = useQueryClient();

  // 📦 BOOKINGS
  const { data = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/api/bookings");
      return res.data.bookings;
    },
  });

  // 🔔 NOTIFICATIONS
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data.notifications;
    },
  });

  // ❌ CANCEL BOOKING
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  // =========================
  // 📍 TODAY LOGIC
  // =========================
  const now = new Date();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayBookings = data.filter((b: any) => {
    const date = new Date(b.startAt);
    return (
      date >= todayStart &&
      date <= todayEnd &&
      (b.status === "PENDING" || b.status === "CONFIRMED")
    );
  });

  // =========================
  // 📊 GROUPING
  // =========================
  const upcoming = data.filter(
    (b: any) =>
      new Date(b.startAt) > todayEnd &&
      (b.status === "PENDING" || b.status === "CONFIRMED")
  );

  const completed = data.filter(
    (b: any) =>
      b.status === "COMPLETED" || b.status === "COMPLETED_UNBILLED"
  );

  const cancelled = data.filter(
    (b: any) => b.status === "CANCELLED"
  );

  // =========================
  // 🎴 CARD
  // =========================
  const renderBookingCard = (booking: any, isToday = false) => (
    <div
      key={booking.id}
      className={`p-4 border rounded-lg shadow-sm flex justify-between items-center ${
        isToday ? "bg-blue-50 border-blue-200" : "bg-white"
      }`}
    >
      <div className="space-y-1">
        <p className="font-medium">
          {booking.supplier?.businessName || "Service Provider"}
        </p>

        <p className="text-sm text-gray-600">
          {formatDate(booking.startAt)} •{" "}
          {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
        </p>

        <p className="text-sm text-gray-500">
          {booking.serviceType}
        </p>
      </div>

      <div className="text-right space-y-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
            booking.status
          )}`}
        >
          {booking.status}
        </span>

        <p className="text-sm font-medium">
          {formatPrice(booking.totalCents)}
        </p>

        <p className="text-xs text-gray-400">
          ID: {booking.id.slice(-6)}
        </p>

        {(booking.status === "PENDING" ||
          booking.status === "CONFIRMED") && (
          <button
            onClick={() =>
              cancelBookingMutation.mutate(booking.id)
            }
            disabled={cancelBookingMutation.isPending}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            {cancelBookingMutation.isPending
              ? "Cancelling..."
              : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* 🔔 NOTIFICATIONS */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((n: any) => (
            <div
              key={n.id}
              className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm"
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-gray-600">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-lg font-medium mb-4">Your Bookings</h2>

        {isLoading && <p>Loading bookings...</p>}

        {!isLoading && data.length === 0 && (
          <p className="text-gray-500">No bookings yet</p>
        )}

        <div className="space-y-8">

          {/* 📍 TODAY */}
          {todayBookings.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3 text-blue-700">
                Today
              </h3>
              <div className="space-y-3">
                {todayBookings.map((b: any) =>
                  renderBookingCard(b, true)
                )}
              </div>
            </div>
          )}

          {/* 📅 UPCOMING */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3">
                Upcoming
              </h3>
              <div className="space-y-3">
                {upcoming.map((b: any) =>
                  renderBookingCard(b)
                )}
              </div>
            </div>
          )}

          {/* ✅ COMPLETED */}
          {completed.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3">
                Completed
              </h3>
              <div className="space-y-3">
                {completed.map((b: any) =>
                  renderBookingCard(b)
                )}
              </div>
            </div>
          )}

          {/* ❌ CANCELLED */}
          {cancelled.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3">
                Cancelled
              </h3>
              <div className="space-y-3">
                {cancelled.map((b: any) =>
                  renderBookingCard(b)
                )}
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}