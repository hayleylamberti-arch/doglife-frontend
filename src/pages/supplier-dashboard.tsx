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
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}

function DeclineModal({
  booking,
  message,
  setMessage,
  onClose,
  onSubmit,
  loading,
}: {
  booking: SupplierBooking;
  message: string;
  setMessage: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Decline booking</h3>
          <p className="mt-1 text-sm text-gray-500">
            You can add an optional note or suggest another time.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="font-medium text-gray-900">
            {String(booking.serviceType || "Booking").replace(/_/g, " ")}
          </div>
          <div>{formatDateTime(booking.startAt)} – {formatDateTime(booking.endAt)}</div>
          <div className="mt-2">Owner: {formatOwnerName(booking)}</div>
          <div>Dogs: {formatDogNames(booking)}</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Optional message / suggested alternative
          </label>
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Example: I’m not available then, but I could do Friday at 10:00."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Declining..." : "Confirm Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onAccept,
  onDecline,
  actionLoading,
}: {
  booking: SupplierBooking;
  onAccept: (bookingId: string) => void;
  onDecline: (booking: SupplierBooking) => void;
  actionLoading: boolean;
}) {
  const isPending = booking.status === "PENDING";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
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

      {isPending ? (
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
    </div>
  );
}

export default function SupplierDashboardPage() {
  const queryClient = useQueryClient();
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [declineBooking, setDeclineBooking] = useState<SupplierBooking | null>(null);
  const [declineMessage, setDeclineMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier-dashboard-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/accept`);
    },
    onMutate: (bookingId) => {
      setActiveBookingId(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-dashboard-bookings"] });
    },
    onError: (error) => {
      console.error(error);
      alert("Failed to accept booking");
    },
    onSettled: () => {
      setActiveBookingId(null);
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({
      bookingId,
      message,
    }: {
      bookingId: string;
      message?: string;
    }) => {
      await api.patch(`/api/supplier/bookings/${bookingId}/decline`, {
        message: message || undefined,
      });
    },
    onMutate: ({ bookingId }) => {
      setActiveBookingId(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-dashboard-bookings"] });
      setDeclineBooking(null);
      setDeclineMessage("");
    },
    onError: (error) => {
      console.error(error);
      alert("Failed to decline booking");
    },
    onSettled: () => {
      setActiveBookingId(null);
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
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={(bookingId) => acceptMutation.mutate(bookingId)}
                  onDecline={(booking) => {
                    setDeclineBooking(booking);
                    setDeclineMessage("");
                  }}
                  actionLoading={activeBookingId === booking.id}
                />
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
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={() => {}}
                  onDecline={() => {}}
                  actionLoading={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {declineBooking ? (
        <DeclineModal
          booking={declineBooking}
          message={declineMessage}
          setMessage={setDeclineMessage}
          onClose={() => {
            if (!declineMutation.isPending) {
              setDeclineBooking(null);
              setDeclineMessage("");
            }
          }}
          onSubmit={() => {
            declineMutation.mutate({
              bookingId: declineBooking.id,
              message: declineMessage.trim(),
            });
          }}
          loading={declineMutation.isPending}
        />
      ) : null}
    </div>
  );
}