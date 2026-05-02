import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
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

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function formatLabel(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusColor(status: string) {
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
      return "bg-gray-100 text-gray-600";
  }
}

function getSupplierMessage(booking: any) {
  if (!booking?.events?.length) return null;

  const sortedEvents = [...booking.events].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const supplierDeclineEvent = sortedEvents.find(
    (event: any) =>
      event.type === "SUPPLIER_DECLINED" &&
      typeof event.message === "string" &&
      event.message.trim().length > 0
  );

  return supplierDeclineEvent?.message || null;
}

function splitNotesIntoParts(notes?: string | null) {
  if (!notes || typeof notes !== "string") return [];

  return notes
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(part);
    }
  }

  return result;
}

function parseBookingNotes(notes?: string | null) {
  const parts = uniqueParts(splitNotesIntoParts(notes));

  const details: string[] = [];
  const addresses: string[] = [];
  const general: string[] = [];

  parts.forEach((part) => {
    const lower = part.toLowerCase();

    if (
      lower.startsWith("grooming option:") ||
      lower.startsWith("size:") ||
      lower.startsWith("daycare type:") ||
      lower.startsWith("half day period:") ||
      lower.startsWith("mobile vet service:") ||
      lower.startsWith("pet sitting location:") ||
      lower.startsWith("kennel type:") ||
      lower.startsWith("journey type:")
    ) {
      details.push(part);
      return;
    }

    if (
      lower.startsWith("pickup point:") ||
      lower.startsWith("drop-off point:") ||
      lower.startsWith("pickup address:") ||
      lower.startsWith("drop-off address:") ||
      lower.startsWith("service address:") ||
      lower.startsWith("owner address:") ||
      lower.startsWith("supplier address:")
    ) {
      addresses.push(part);
      return;
    }

    general.push(part);
  });

  return {
    details,
    addresses,
    general,
  };
}

function BookingMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
      <span className="mr-1 font-medium">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function Section({
  id,
  title,
  bookings,
  renderBookingCard,
  titleColor,
  isOpen,
  onToggle,
}: {
  id: string;
  title: string;
  bookings: any[];
  renderBookingCard: (booking: any, isToday?: boolean) => React.ReactNode;
  titleColor?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (bookings.length === 0) return null;

  return (
    <section id={id} className="rounded-2xl border border-gray-200 bg-white p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h3 className={`text-lg font-semibold ${titleColor || "text-gray-900"}`}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {bookings.length}
          </span>
          <span className="text-xl text-gray-500">{isOpen ? "−" : "+"}</span>
        </div>
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-4">
          {bookings.map((booking: any) => renderBookingCard(booking))}
        </div>
      ) : null}
    </section>
  );
}

const SERVICE_SHORTCUTS = [
  { key: "WALKING", label: "Walking", icon: "🐾", href: "/search?service=WALKING" },
  { key: "TRAINING", label: "Training", icon: "🎓", href: "/search?service=TRAINING" },
  { key: "GROOMING", label: "Grooming", icon: "✂️", href: "/search?service=GROOMING" },
  { key: "BOARDING", label: "Boarding", icon: "🏠", href: "/search?service=BOARDING" },
  { key: "DAYCARE", label: "Daycare", icon: "☀️", href: "/search?service=DAYCARE" },
  { key: "PET_SITTING", label: "Pet Sitting", icon: "🩷", href: "/search?service=PET_SITTING" },
  { key: "PET_TRANSPORT", label: "Transport", icon: "🚗", href: "/search?service=PET_TRANSPORT" },
  { key: "MOBILE_VET", label: "Mobile Vet", icon: "🩺", href: "/search?service=MOBILE_VET" },
];

function ServiceShortcuts() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Book a service</h2>
          <p className="mt-1 text-sm text-gray-500">
            Preferred providers first, then providers in your suburb.
          </p>
        </div>

        <Link
          to="/search"
          className="hidden text-sm font-medium text-blue-600 hover:text-blue-700 md:inline"
        >
          View all
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {SERVICE_SHORTCUTS.map((service) => (
            <Link
              key={service.key}
              to={service.href}
              className="group flex w-24 shrink-0 flex-col items-center text-center"
            >
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-3xl md:text-4xl shadow-sm transition group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-md">
                <span aria-hidden="true">{service.icon}</span>
              </div>
              <span className="mt-2 text-center text-sm md:text-base font-medium leading-tight text-gray-800">
                {service.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    today: true,
    pending: true,
    confirmed: true,
    "in-progress": false,
    "completed-unbilled": false,
    completed: false,
    cancelled: false,
  });

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

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const todayEnd = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const sortedBookings = useMemo(() => {
    return [...data].sort(
      (a: any, b: any) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [data]);

  const todayBookings = sortedBookings.filter((b: any) => {
    const date = new Date(b.startAt);
    return (
      date >= todayStart &&
      date <= todayEnd &&
      (b.status === "PENDING" || b.status === "CONFIRMED")
    );
  });

  const pendingBookings = sortedBookings.filter(
    (b: any) =>
      b.status === "PENDING" &&
      !todayBookings.some((todayBooking: any) => todayBooking.id === b.id)
  );

  const confirmedBookings = sortedBookings.filter(
    (b: any) =>
      b.status === "CONFIRMED" &&
      !todayBookings.some((todayBooking: any) => todayBooking.id === b.id)
  );

  const inProgressBookings = sortedBookings.filter(
    (b: any) => b.status === "IN_PROGRESS"
  );

  const completedAwaitingPaymentBookings = sortedBookings.filter(
    (b: any) => b.status === "COMPLETED_UNBILLED"
  );

  const completedPaidBookings = sortedBookings.filter(
    (b: any) => b.status === "COMPLETED"
  );

  const cancelledBookings = sortedBookings.filter(
    (b: any) => b.status === "CANCELLED"
  );

  const bookingSections = [
    {
      key: "today",
      title: "Today",
      bookings: todayBookings,
      titleColor: "text-blue-700",
      isToday: true,
    },
    {
      key: "pending",
      title: "Pending",
      bookings: pendingBookings,
      titleColor: "text-yellow-700",
      isToday: false,
    },
    {
      key: "confirmed",
      title: "Confirmed",
      bookings: confirmedBookings,
      titleColor: "text-green-700",
      isToday: false,
    },
    {
      key: "in-progress",
      title: "Started / In Progress",
      bookings: inProgressBookings,
      titleColor: "text-blue-700",
      isToday: false,
    },
    {
      key: "completed-unbilled",
      title: "Completed - Awaiting Payment",
      bookings: completedAwaitingPaymentBookings,
      titleColor: "text-purple-700",
      isToday: false,
    },
    {
      key: "completed",
      title: "Completed - Paid",
      bookings: completedPaidBookings,
      titleColor: "text-gray-800",
      isToday: false,
    },
    {
      key: "cancelled",
      title: "Cancelled",
      bookings: cancelledBookings,
      titleColor: "text-red-700",
      isToday: false,
    },
  ];

  const hasAnyBookings = bookingSections.some(
    (section) => section.bookings.length > 0
  );

  function toggleSection(sectionKey: string) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }

  const renderBookingCard = (booking: any, isToday = false) => {
    const supplierMessage =
      booking.status === "CANCELLED" ? getSupplierMessage(booking) : null;

    const parsedNotes = parseBookingNotes(booking.notes);

    return (
      <div
        key={booking.id}
        className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
          isToday ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {booking.supplier?.businessName || "Service Provider"}
              </p>

              <p className="text-sm text-gray-500">
                {formatDate(booking.startAt)} • {formatTime(booking.startAt)} –{" "}
                {formatTime(booking.endAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs uppercase tracking-wide text-gray-700">
                {booking.supplierService?.service || booking.serviceType}
              </span>

              {booking.supplierService?.unit ? (
                <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  {formatLabel(
                    String(booking.supplierService.unit).replace(/^PER_/, "")
                  )}
                </span>
              ) : null}

              {booking.supplierService?.durationMinutes ? (
                <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  {booking.supplierService.durationMinutes} mins
                </span>
              ) : null}
            </div>

            <p className="text-sm text-gray-700">
              🐶{" "}
              {booking.dogs?.length
                ? booking.dogs.map((d: any) => d.dog.name).join(", ")
                : "No dogs selected"}
            </p>

            {parsedNotes.details.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsedNotes.details.map((detail) => {
                  const [rawLabel, ...rest] = detail.split(":");
                  const value = rest.join(":").trim();

                  return (
                    <BookingMetaPill
                      key={detail}
                      label={rawLabel.trim()}
                      value={value}
                    />
                  );
                })}
              </div>
            ) : null}

            {parsedNotes.addresses.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">
                  Location details
                </p>
                <div className="mt-2 space-y-1">
                  {parsedNotes.addresses.map((address) => (
                    <p key={address} className="text-sm text-gray-700">
                      {address}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {parsedNotes.general.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">Notes</p>
                <div className="mt-2 space-y-1">
                  {parsedNotes.general.map((note) => (
                    <p key={note} className="text-sm text-gray-700">
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {booking.status === "IN_PROGRESS" ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-700">
                  Service in progress
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  Your supplier has started this booking.
                </p>
              </div>
            ) : null}

            {booking.status === "COMPLETED_UNBILLED" ? (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="text-sm font-medium text-purple-700">
                  Completed - awaiting payment
                </p>
                <p className="mt-1 text-sm text-purple-700">
                  Completed at: {formatDateTime(booking.completedAt)}
                </p>
              </div>
            ) : null}

            {booking.status === "COMPLETED" ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">
                  Completed and paid
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Completed at: {formatDateTime(booking.completedAt)}
                </p>
              </div>
            ) : null}

            {supplierMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  Supplier message
                </p>
                <p className="mt-1 text-sm text-red-700">{supplierMessage}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 text-left md:text-right">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
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
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition hover:bg-red-600 disabled:opacity-50"
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
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to DogLife 🐾
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Easily manage your bookings, view service updates, and book trusted
              dog services near you.
            </p>
          </div>

          <Link
            to="/search"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Make a booking
          </Link>
        </div>
      </div>

      <ServiceShortcuts />

      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((n: any) => (
            <div
              key={n.id}
              className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
            >
              <p className="font-semibold text-gray-800">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          Your Bookings
        </h2>

        {isLoading ? <p>Loading bookings...</p> : null}

        {!isLoading && !hasAnyBookings ? (
          <p className="text-gray-500">
            No bookings yet — find trusted dog services near you 🐾
          </p>
        ) : null}

        {!isLoading && hasAnyBookings ? (
          <div className="space-y-6">
            {bookingSections.map((section) => (
              <Section
                key={section.key}
                id={section.key}
                title={section.title}
                bookings={section.bookings}
                renderBookingCard={(booking) =>
                  renderBookingCard(booking, section.isToday)
                }
                titleColor={section.titleColor}
                isOpen={Boolean(openSections[section.key])}
                onToggle={() => toggleSection(section.key)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}