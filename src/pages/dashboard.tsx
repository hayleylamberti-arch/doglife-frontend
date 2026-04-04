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

  const { data, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/api/bookings");
      return res.data.bookings;
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await api.patch(`/api/bookings/${bookingId}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  // ✅ GROUP BOOKINGS
  
const upcoming = data
  ?.filter(
    (b: any) => b.status === "PENDING" || b.status === "CONFIRMED"
  )
  .sort(
    (a: any, b: any) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

const completed = data
  ?.filter(
    (b: any) =>
      b.status === "COMPLETED" || b.status === "COMPLETED_UNBILLED"
  )
  .sort(
    (a: any, b: any) =>
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );

const cancelled = data
  ?.filter((b: any) => b.status === "CANCELLED")
  .sort(
    (a: any, b: any) =>
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
  
  const renderBooking = (booking: any) => (
    <div
      key={booking.id}
      className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center"
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
            onClick={() => cancelBookingMutation.mutate(booking.id)}
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

      {isLoading && <p>Loading bookings...</p>}

      {/* ✅ UPCOMING */}
      <section>
        <h2 className="text-lg font-medium mb-4">Upcoming</h2>
        <div className="space-y-3">
          {upcoming?.map(renderBooking)}
        </div>
      </section>

      {/* ✅ COMPLETED */}
      <section>
        <h2 className="text-lg font-medium mb-4">Completed</h2>
        <div className="space-y-3">
          {completed?.map(renderBooking)}
        </div>
      </section>

      {/* ✅ CANCELLED */}
      <section>
        <h2 className="text-lg font-medium mb-4">Cancelled</h2>
        <div className="space-y-3">
          {cancelled?.map(renderBooking)}
        </div>
      </section>
    </div>
  );
}