import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

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

type BookingEvent = {
  id: string;
  type: string;
  message?: string | null;
  createdAt?: string;
};

type ServiceLocationSummary = {
  type: "OWNER_HOME" | "SUPPLIER_LOCATION" | "TRANSPORT";
  label?: string | null;
  addressLine?: string | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
};

type SupplierBooking = {
  id: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  totalCents?: number | null;
  serviceType?: string | null;
  notes?: string | null;
  completedAt?: string | null;
  serviceLocationSummary?: ServiceLocationSummary | null;
  owner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  dogs?: BookingDog[];
  events?: BookingEvent[];
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
  return (
    booking.dogs
      ?.map((item) => item?.dog?.name)
      .filter(Boolean)
      .join(", ") || "No dogs linked"
  );
}

function formatServiceName(value?: string | null) {
  return String(value || "Booking").replace(/_/g, " ");
}

function getStatusBadgeClass(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    case "COMPLETED_UNBILLED":
      return "bg-purple-100 text-purple-700";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function sortBookingsByStart(bookings: SupplierBooking[]) {
  return [...bookings].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}

function LocationSummary({ booking }: { booking: SupplierBooking }) {
  const location = booking.serviceLocationSummary;

  if (!location) return null;

  if (location.type === "TRANSPORT") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <div className="font-medium">Pickup and drop-off</div>
        {location.pickupAddress ? <div>Pickup: {location.pickupAddress}</div> : null}
        {location.dropoffAddress ? <div>Drop-off: {location.dropoffAddress}</div> : null}
      </div>
    );
  }

  if (!location.addressLine) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      <div className="font-medium">{location.label || "Service location"}</div>
      <div className="mt-1 whitespace-pre-line">{location.addressLine}</div>
    </div>
  );
}

function BookingCard({
  booking,
  onAccept,
  onDecline,
  onStart,
  onComplete,
  onMarkPaid,
  actionLoading,
}: {
  booking: SupplierBooking;
  onAccept: (bookingId: string) => void;
  onDecline: (booking: SupplierBooking) => void;
  onStart: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  onMarkPaid: (bookingId: string) => void;
  actionLoading: boolean;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-gray-900">
            {formatServiceName(booking.serviceType)}
          </div>
          <div className="text-sm text-gray-500">
            {formatDateTime(booking.startAt)} – {formatDateTime(booking.endAt)}
          </div>
        </div>

        <div className="space-y-2 text-right">
          <div
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
              booking.status
            )}`}
          >
            {booking.status}
          </div>
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

      <LocationSummary booking={booking} />

      {booking.notes ? (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Notes:</span> {booking.notes}
        </div>
      ) : null}

      {booking.status === "PENDING" ? (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onAccept(booking.id)}
            disabled={actionLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {actionLoading ? "Working..." : "Accept"}
          </button>

          <button
            type="button"
            onClick={() => onDecline(booking)}
            disabled={actionLoading}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            {actionLoading ? "Working..." : "Decline"}
          </button>
        </div>
      ) : null}

      {booking.status === "CONFIRMED" ? (
        <button
          type="button"
          onClick={() => onStart(booking.id)}
          disabled={actionLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {actionLoading ? "Starting..." : "Start Service"}
        </button>
      ) : null}

      {booking.status === "IN_PROGRESS" ? (
        <button
          type="button"
          onClick={() => onComplete(booking.id)}
          disabled={actionLoading}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {actionLoading ? "Completing..." : "Complete Service"}
        </button>
      ) : null}

      {booking.status === "COMPLETED_UNBILLED" ? (
        <button
          type="button"
          onClick={() => onMarkPaid(booking.id)}
          disabled={actionLoading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {actionLoading ? "Saving..." : "Mark Paid"}
        </button>
      ) : null}
    </div>
  );
}

function BookingSection({
  id,
  title,
  emptyText,
  bookings,
  isLoading,
  error,
  activeBookingId,
  onAccept,
  onDecline,
  onStart,
  onComplete,
  onMarkPaid,
}: {
  id: string;
  title: string;
  emptyText: string;
  bookings: SupplierBooking[];
  isLoading: boolean;
  error: unknown;
  activeBookingId: string | null;
  onAccept: (bookingId: string) => void;
  onDecline: (booking: SupplierBooking) => void;
  onStart: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  onMarkPaid: (bookingId: string) => void;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {bookings.length}
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Loading bookings...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load supplier bookings.
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onAccept={onAccept}
              onDecline={onDecline}
              onStart={onStart}
              onComplete={onComplete}
              onMarkPaid={onMarkPaid}
              actionLoading={activeBookingId === booking.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  href,
  label,
  value,
  valueClassName,
}: {
  href: string;
  label: string;
  value: number;
  valueClassName: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</div>
    </a>
  );
}

export default function SupplierDashboardPage() {
  const queryClient = useQueryClient();
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier-dashboard-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    },
  });

  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-dashboard-bookings"] });
  };

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/accept`);
    },
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const startMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/start`);
    },
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/complete`);
    },
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/mark-paid`);
    },
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const declineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/decline`);
    },
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const rawBookings: SupplierBooking[] = data?.bookings || data?.data || data || [];
  const bookings = Array.isArray(rawBookings) ? rawBookings : [];

  const pendingBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "PENDING")
  );
  const confirmedBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "CONFIRMED")
  );
  const inProgressBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "IN_PROGRESS")
  );
  const completedUnbilledBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "COMPLETED_UNBILLED")
  );
  const completedBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "COMPLETED")
  );
  const cancelledBookings = sortBookingsByStart(
    bookings.filter((b) => b.status === "CANCELLED")
  );

  const totalActive = bookings.filter(
    (b) =>
      b.status === "PENDING" ||
      b.status === "CONFIRMED" ||
      b.status === "IN_PROGRESS" ||
      b.status === "COMPLETED_UNBILLED"
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-500">
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

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          href="#pending-bookings"
          label="Pending bookings"
          value={pendingBookings.length}
          valueClassName="text-amber-600"
        />

        <StatCard
          href="#confirmed-bookings"
          label="Confirmed bookings"
          value={confirmedBookings.length}
          valueClassName="text-green-600"
        />

        <StatCard
          href="#in-progress-bookings"
          label="In progress"
          value={inProgressBookings.length}
          valueClassName="text-blue-600"
        />

        <StatCard
          href="#active-bookings"
          label="Total active bookings"
          value={totalActive}
          valueClassName="text-gray-900"
        />
      </div>

      <div id="active-bookings" className="grid gap-8 lg:grid-cols-2">
        <BookingSection
          id="pending-bookings"
          title="Pending Bookings"
          emptyText="No pending bookings."
          bookings={pendingBookings}
          isLoading={isLoading}
          error={error}
          activeBookingId={activeBookingId}
          onAccept={(id) => acceptMutation.mutate(id)}
          onDecline={(booking) => declineMutation.mutate(booking.id)}
          onStart={(id) => startMutation.mutate(id)}
          onComplete={(id) => completeMutation.mutate(id)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
        />

        <BookingSection
          id="confirmed-bookings"
          title="Confirmed Bookings"
          emptyText="No confirmed bookings."
          bookings={confirmedBookings}
          isLoading={isLoading}
          error={error}
          activeBookingId={activeBookingId}
          onAccept={(id) => acceptMutation.mutate(id)}
          onDecline={(booking) => declineMutation.mutate(booking.id)}
          onStart={(id) => startMutation.mutate(id)}
          onComplete={(id) => completeMutation.mutate(id)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
        />

        <BookingSection
          id="in-progress-bookings"
          title="In Progress"
          emptyText="No bookings in progress."
          bookings={inProgressBookings}
          isLoading={isLoading}
          error={error}
          activeBookingId={activeBookingId}
          onAccept={(id) => acceptMutation.mutate(id)}
          onDecline={(booking) => declineMutation.mutate(booking.id)}
          onStart={(id) => startMutation.mutate(id)}
          onComplete={(id) => completeMutation.mutate(id)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
        />

        <BookingSection
          id="completed-unbilled-bookings"
          title="Completed - Awaiting Payment"
          emptyText="No completed unpaid bookings."
          bookings={completedUnbilledBookings}
          isLoading={isLoading}
          error={error}
          activeBookingId={activeBookingId}
          onAccept={(id) => acceptMutation.mutate(id)}
          onDecline={(booking) => declineMutation.mutate(booking.id)}
          onStart={(id) => startMutation.mutate(id)}
          onComplete={(id) => completeMutation.mutate(id)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
        />

        <BookingSection
          id="completed-bookings"
          title="Completed - Paid"
          emptyText="No completed paid bookings."
          bookings={completedBookings}
          isLoading={isLoading}
          error={error}
          activeBookingId={activeBookingId}
          onAccept={(id) => acceptMutation.mutate(id)}
          onDecline={(booking) => declineMutation.mutate(booking.id)}
          onStart={(id) => startMutation.mutate(id)}
          onComplete={(id) => completeMutation.mutate(id)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
        />

        <BookingSection
          id="cancelled-bookings"
          title="Cancelled"
          emptyText="No cancelled bookings."
          bookings={cancelledBookings}
          isLoading={isLoading}
          error={error}
          activeBookingId={activeBookingId}
          onAccept={(id) => acceptMutation.mutate(id)}
          onDecline={(booking) => declineMutation.mutate(booking.id)}
          onStart={(id) => startMutation.mutate(id)}
          onComplete={(id) => completeMutation.mutate(id)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
        />
      </div>
    </div>
  );
}