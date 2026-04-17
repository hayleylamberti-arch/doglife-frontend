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

function getSupplierMessage(booking: any) {
  if (!booking?.bookingEvents?.length) return null;

  const supplierDeclineEvent = booking.bookingEvents.find(
    (event: any) =>
      event.type === "SUPPLIER_DECLINED" &&
      typeof event.message === "string" &&
      event.message.trim().length > 0
  );

  return supplierDeclineEvent?.message || null;
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/api/bookings");
      return res.data.bookings;
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data.notifications;
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

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

  const upcoming = data.filter(
    (b: any) =>
      new Date(b.startAt) > todayEnd &&
      (b.status === "PENDING" || b.status === "CONFIRMED")
  );

  const completed = data.filter(
    (b: any) =>
      b.status === "COMPLETED" || b.status === "COMPLETED_UNBILLED"
  );

  const cancelled = data.filter((b: any) => b.status === "CANCELLED");

  const renderBookingCard = (booking: any, isToday = false) => {
    const supplierMessage =
      booking.status === "CANCELLED" ? getSupplierMessage(booking) : null;

    return (
      <div
        key={booking.id}
        className={`p-5 rounded-xl border shadow-sm transition hover:shadow-md ${
          isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              {booking.supplier?.businessName || "Service Provider"}
            </p>

            <p className="text-sm text-gray-500">
              {formatDate(booking.startAt)} • {formatTime(booking.startAt)} –{" "}
              {formatTime(booking.endAt)}
            </p>

            <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wide">
              {booking.supplierService?.service || booking.serviceType}
            </span>

            <p className="text-sm text-gray-700">
              🐶{" "}
              {booking.dogs?.length
                ? booking.dogs.map((d: any) => d.dog.name).join(", ")
                : "No dogs selected"}
            </p>

            {supplierMessage ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  Supplier message
                </p>
                <p className="mt-1 text-sm text-red-700">{supplierMessage}</p>
              </div>
            ) : null}
          </div>

          <div className="text-right space-y-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status}
            </span>

            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(booking.totalCents)}
            </p>

            <p className="text-xs text-gray-400">#{booking.id.slice(-6)}</p>

            {(booking.status === "PENDING" ||
              booking.status === "CONFIRMED") && (
              <button
                onClick={() => cancelBookingMutation.mutate(booking.id)}
                disabled={cancelBookingMutation.isPending}
                className="bg-red-500 hover:bg-red-600 transition text-white px-3 py-1.5 rounded-lg text-sm"
              >
                {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((n: any) => (
            <div
              key={n.id}
              className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p className="font-semibold text-gray-800">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          Your Bookings
        </h2>

        {isLoading && <p>Loading bookings...</p>}

        {!isLoading && data.length === 0 && (
          <p className="text-gray-500">
            No bookings yet — find trusted dog services near you 🐾
          </p>
        )}

        <div className="space-y-10">
          {todayBookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Today</h3>
              <div className="space-y-4">
                {todayBookings.map((b: any) => renderBookingCard(b, true))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming</h3>
              <div className="space-y-4">
                {upcoming.map((b: any) => renderBookingCard(b))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Completed</h3>
              <div className="space-y-4">
                {completed.map((b: any) => renderBookingCard(b))}
              </div>
            </div>
          )}

          {cancelled.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Cancelled</h3>
              <div className="space-y-4">
                {cancelled.map((b: any) => renderBookingCard(b))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}