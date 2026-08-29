import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type AdminBooking = {
  id: string;
  status: string;
  serviceType: string;
  totalCents: number;
  startAt: string;
  endAt: string;
  createdAt: string;
  completedAt?: string | null;
  owner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  supplier?: {
    id: string;
    businessName?: string | null;
  } | null;
  suburb?: {
    id: string;
    suburbName?: string | null;
  } | null;
  dogs?: Array<{
    id: string;
    name?: string | null;
  }>;
};

type AdminBookingsResponse = {
  ok: boolean;
  bookings: AdminBooking[];
};

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(cents?: number | null) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getOwnerName(booking: AdminBooking) {
  if (!booking.owner) return "—";

  return (
    [booking.owner.firstName, booking.owner.lastName]
      .filter(Boolean)
      .join(" ") || "Unnamed owner"
  );
}

function getDogNames(booking: AdminBooking) {
  const names =
    booking.dogs
      ?.map((dog) => dog.name)
      .filter((name): name is string => Boolean(name)) ?? [];

  return names.length > 0 ? names.join(", ") : "—";
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "CONFIRMED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "IN_PROGRESS":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "COMPLETED_UNBILLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-gray-200 bg-gray-100 text-gray-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery<AdminBookingsResponse>({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/admin/bookings");
      return res.data;
    },
  });

  const bookings = data?.bookings ?? [];

  const metrics = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "PENDING").length,
      inProgress: bookings.filter(
        (booking) => booking.status === "IN_PROGRESS"
      ).length,
      completedUnbilled: bookings.filter(
        (booking) => booking.status === "COMPLETED_UNBILLED"
      ).length,
      totalValueCents: bookings.reduce(
        (sum, booking) => sum + (booking.totalCents ?? 0),
        0
      ),
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (statusFilter !== "ALL" && booking.status !== statusFilter) {
        return false;
      }

      if (!search) return true;

      const searchable = [
        booking.id,
        booking.serviceType,
        booking.status,
        booking.supplier?.businessName,
        booking.suburb?.suburbName,
        getOwnerName(booking),
        getDogNames(booking),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [bookings, searchTerm, statusFilter]);

  if (isLoading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  if (error || !data?.ok) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h1 className="font-semibold text-red-700">
            Unable to load bookings
          </h1>
          <p className="mt-2 text-sm text-red-700">
            Please refresh the page or try again shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 pb-10 pt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Booking Operations
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Bookings
          </h1>

          <p className="mt-2 max-w-2xl text-gray-500">
            Review booking activity, service status, owners, dogs and supplier
            fulfilment.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search bookings..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED_UNBILLED">Completed unbilled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Bookings
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900">
            {metrics.total}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pending
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600">
            {metrics.pending}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            In Progress
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">
            {metrics.inProgress}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Unbilled
          </p>
          <p className="mt-2 text-4xl font-bold text-red-600">
            {metrics.completedUnbilled}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Booking Value
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatMoney(metrics.totalValueCents)}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Booking Activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredBookings.length} of {bookings.length} bookings.
          </p>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-6 text-gray-500">No bookings found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                        booking.status
                      )}`}
                    >
                      {formatLabel(booking.status)}
                    </span>

                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {formatLabel(booking.serviceType)}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-gray-900">
                    {booking.supplier?.businessName || "Unnamed supplier"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Booking {booking.id.slice(0, 8)}
                  </p>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {formatMoney(booking.totalCents)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Owner & Dogs
                  </p>

                  <p className="mt-2 font-medium text-gray-900">
                    {getOwnerName(booking)}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {getDogNames(booking)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Service
                  </p>

                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {booking.suburb?.suburbName || "No suburb captured"}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Starts: {formatDateTime(booking.startAt)}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Ends: {formatDateTime(booking.endAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Admin Detail
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Created: {formatDateTime(booking.createdAt)}
                  </p>

                  {booking.completedAt ? (
                    <p className="mt-1 text-sm text-gray-500">
                      Completed: {formatDateTime(booking.completedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
