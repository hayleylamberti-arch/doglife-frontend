import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED_UNBILLED"
  | "COMPLETED"
  | "CANCELLED";

type BookingDog = {
  dog?: {
    id: string;
    name: string;
    breed?: string | null;
  };
};

type SupplierBooking = {
  id: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  totalCents?: number | null;
  serviceType?: string | null;
  notes?: string | null;
  owner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  dogs?: BookingDog[];
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);

  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(cents?: number | null) {
  const amount = Number(cents || 0) / 100;
  return `R${amount.toFixed(0)}`;
}

function formatOwnerName(booking: SupplierBooking) {
  const first = booking.owner?.firstName || "";
  const last = booking.owner?.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || booking.owner?.email || "Owner";
}

function formatDogNames(booking: SupplierBooking) {
  const names =
    booking.dogs
      ?.map((item) => item?.dog?.name)
      .filter(Boolean)
      .join(", ") || "";

  return names || "No dogs linked";
}

function sortBookingsByStart(bookings: SupplierBooking[]) {
  return [...bookings].sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}

function BookingCard({ booking }: { booking: SupplierBooking }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-gray-900">
            {String(booking.serviceType || "Booking").replace(/_/g, " ")}
          </div>
          <div className="text-sm text-gray-500">
            {formatDateTime(booking.startAt)} – {formatDateTime(booking.endAt)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">{booking.status}</div>
          <div className="font-semibold text-gray-900">
            {formatMoney(booking.totalCents)}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-700">
        <span className="font-medium">Owner:</span> {formatOwnerName(booking)}
      </div>

      <div className="text-sm text-gray-700">
        <span className="font-medium">Dogs:</span> {formatDogNames(booking)}
      </div>

      {booking.notes ? (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Notes:</span> {booking.notes}
        </div>
      ) : null}
    </div>
  );
}

export default function SupplierDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier-dashboard-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    },
  });

  const rawBookings: SupplierBooking[] =
    data?.bookings || data?.data || data || [];

  const bookings = Array.isArray(rawBookings) ? rawBookings : [];

  const pendingBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "PENDING")
  );

  const upcomingBookings = sortBookingsByStart(
    bookings.filter(
      (b) =>
        b.status === "CONFIRMED" ||
        b.status === "IN_PROGRESS" ||
        b.status === "COMPLETED_UNBILLED"
    )
  );

  const totalActive = bookings.filter(
    (b) => b.status !== "CANCELLED" && b.status !== "COMPLETED"
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Manage bookings and keep your business profile updated.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/supplier/business-profile"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit Business Profile
          </Link>
          <Link
            to="/supplier/availability"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Update Availability
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Pending bookings</div>
          <div className="mt-2 text-3xl font-bold text-amber-600">
            {pendingBookings.length}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Upcoming active bookings</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {upcomingBookings.length}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Total active bookings</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalActive}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Pending Bookings
            </h2>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              Loading bookings...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Failed to load supplier bookings.
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No pending bookings.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Upcoming Bookings
            </h2>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              Loading bookings...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Failed to load supplier bookings.
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No upcoming bookings.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}