import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

    if (
      lower.startsWith("service location:") ||
      lower.startsWith("training location:") ||
      lower === "owner home" ||
      lower === "supplier location"
    ) {
      return;
    }

    general.push(part);
  });

  return { details, addresses, general };
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

function DogProfilePrompt() {
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-orange-900">
        Create your Dog Passport 🐶
      </h2>

      <p className="mt-2 text-sm text-orange-800">
        Your Dog Passport stores important health, care and behaviour
        information so suppliers can safely care for your dog.
      </p>

      <div className="mt-3 text-sm text-orange-800">
        Includes:
        <ul className="mt-2 ml-5 list-disc space-y-1">
          <li>Vaccinations & treatments</li>
          <li>Vet & emergency details</li>
          <li>Behaviour & care notes</li>
          <li>Medical history</li>
          <li>Microchip details</li>
        </ul>
      </div>

      <Link
        to="/owner/my-dogs"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Create Dog Passport
      </Link>
    </div>
  );
}

function ServiceShortcuts({ hasDogs }: { hasDogs: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Book a service</h2>
          <p className="mt-1 text-sm text-gray-500">
            {hasDogs
              ? "Preferred providers first, then providers in your suburb."
              : "Create your Dog Passport first, then you can book trusted services."}
          </p>
        </div>

        {hasDogs ? (
          <Link
            to="/search"
            className="hidden text-sm font-medium text-blue-600 hover:text-blue-700 md:inline"
          >
            View all
          </Link>
        ) : null}
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3 md:gap-4">
          {SERVICE_SHORTCUTS.map((service) => (
            <Link
              key={service.key}
              to={hasDogs ? service.href : "/owner/my-dogs"}
              className={`group flex w-20 shrink-0 flex-col items-center text-center md:w-24 ${
                hasDogs ? "" : "opacity-70"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-2xl shadow-sm transition group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-md md:h-20 md:w-20 md:text-4xl">
                <span aria-hidden="true">{service.icon}</span>
              </div>

              <span className="mt-2 text-xs font-medium leading-tight text-gray-800 md:text-sm">
                {service.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400 md:hidden">
        Swipe to see more services
      </p>
    </div>
  );
}

function OwnerBookingJourney({ hasDogs }: { hasDogs: boolean }) {
  const steps = [
    {
      icon: "🐶",
      title: "Create Dog Passport",
      text: "Add health, care and behaviour details.",
      active: !hasDogs,
      href: "/owner/my-dogs",
    },
    {
      icon: "🔎",
      title: "Find a provider",
      text: "Search by service, suburb and price.",
      active: hasDogs,
      href: "/search",
    },
    {
      icon: "📅",
      title: "Send request",
      text: "Choose a time that suits you.",
      active: false,
      href: "/search",
    },
    {
      icon: "✅",
      title: "Get confirmed",
      text: "Supplier accepts your booking.",
      active: false,
      href: null,
    },
    {
      icon: "❤️",
      title: "Service completed",
      text: "Track updates and book again.",
      active: false,
      href: null,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            How DogLife works
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            A simple journey from Dog Passport to trusted care.
          </p>
        </div>

        <Link
          to={hasDogs ? "/search" : "/owner/my-dogs"}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {hasDogs ? "Find a service" : "Create Dog Passport"}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const cardClass = `block rounded-xl border p-4 transition ${
            step.active
              ? "border-blue-200 bg-blue-50"
              : "border-gray-200 bg-gray-50"
          } ${
            step.href
              ? "cursor-pointer hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              : "cursor-default opacity-80"
          }`;

          const content = (
            <>
              <div className="text-2xl">{step.icon}</div>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-xs text-gray-500">{step.text}</p>
            </>
          );

          return step.href ? (
            <Link key={step.title} to={step.href} className={cardClass}>
              {content}
            </Link>
          ) : (
            <div key={step.title} className={cardClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const focusBookingId = searchParams.get("bookingId");
  const focusAction = searchParams.get("action");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    today: true,
    pending: true,
    confirmed: true,
    "in-progress": false,
    "completed-unbilled": false,
    completed: false,
    cancelled: false,
  });

  const [accessInstructionInputs, setAccessInstructionInputs] = useState<Record<string, string>>({});
  const [savedAccessInstructionId, setSavedAccessInstructionId] = useState<string | null>(null);
  const [reviewInputs, setReviewInputs] = useState<
    Record<string, { rating: string; comment: string }>
  >({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/api/bookings");
      return res.data.bookings;
    },
  });

  const { data: dogsData, isLoading: isDogsLoading } = useQuery({
    queryKey: ["owner-dogs"],
    queryFn: async () => {
      const res = await api.get("/api/owner/dogs");
      return res.data;
    },
  });

  const dogs = dogsData?.dogs || [];
  const hasDogs = dogs.length > 0;

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

  const updateAccessInstructionsMutation = useMutation({
    mutationFn: async ({
      bookingId,
      accessInstructions,
    }: {
      bookingId: string;
      accessInstructions: string;
    }) => {
      await api.patch(`/api/bookings/${bookingId}/access-instructions`, {
        accessInstructions,
      });
    },
    onSuccess: (_data, variables) => {
      setSavedAccessInstructionId(variables.bookingId);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      window.setTimeout(() => {
        setSavedAccessInstructionId(null);
      }, 3000);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({
      bookingId,
      rating,
      comment,
    }: {
      bookingId: string;
      rating: string;
      comment: string;
    }) => {
      await api.post("/api/reviews", {
        bookingId,
        rating: Number(rating),
        comment: comment.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );
  }, [data]);

  const todayBookings = sortedBookings.filter((b: any) => {
    const date = new Date(b.startAt);
    return date >= todayStart && date <= todayEnd;
  });

  const todayBookingIds = new Set(todayBookings.map((b: any) => b.id));

  const pendingBookings = sortedBookings.filter(
    (b: any) => b.status === "PENDING" && !todayBookingIds.has(b.id)
  );

  const confirmedBookings = sortedBookings.filter(
    (b: any) => b.status === "CONFIRMED" && !todayBookingIds.has(b.id)
  );

  const inProgressBookings = sortedBookings.filter(
    (b: any) => b.status === "IN_PROGRESS" && !todayBookingIds.has(b.id)
  );

  const completedAwaitingPaymentBookings = sortedBookings.filter(
    (b: any) => b.status === "COMPLETED_UNBILLED" && !todayBookingIds.has(b.id)
  );

  const completedPaidBookings = [...sortedBookings]
    .filter((b: any) => b.status === "COMPLETED" && !todayBookingIds.has(b.id))
    .sort((a: any, b: any) => {
      const aPendingReview = !a.hasOwnerReviewed;
      const bPendingReview = !b.hasOwnerReviewed;

      if (aPendingReview !== bPendingReview) {
        return aPendingReview ? -1 : 1;
      }

      return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
    });

  const cancelledBookings = sortedBookings.filter(
    (b: any) => b.status === "CANCELLED" && !todayBookingIds.has(b.id)
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

  function handleNotificationClick(notification: any) {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    const bookingId = notification.referenceId || notification.booking?.id;

    if (!bookingId) return;

    const section = bookingSections.find((bookingSection) =>
      bookingSection.bookings.some(
        (booking: any) => booking.id === bookingId
      )
    );

    if (section) {
      setOpenSections((prev) => ({
        ...prev,
        [section.key]: true,
      }));
    }

    setTimeout(() => {
      document
        .getElementById(`booking-${bookingId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  useEffect(() => {
    if (!focusBookingId) return;

    const section = bookingSections.find((bookingSection) =>
      bookingSection.bookings.some(
        (booking: any) => booking.id === focusBookingId
      )
    );

    if (!section) return;

    setOpenSections((prev) => ({
      ...prev,
      [section.key]: true,
    }));

    setTimeout(() => {
      const targetId =
        focusAction === "review"
          ? `review-${focusBookingId}`
          : `booking-${focusBookingId}`;

      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  }, [focusBookingId, focusAction, bookingSections]);

  const renderBookingCard = (booking: any, isToday = false) => {
    const supplierMessage =
      booking.status === "CANCELLED" ? getSupplierMessage(booking) : null;

    const parsedNotes = parseBookingNotes(booking.notes);
    const canShowAccessInstructions =
      booking.serviceLocationSummary?.type === "OWNER_HOME" ||
      booking.serviceLocationSummary?.type === "TRANSPORT";

    const highlightReview =
      focusAction === "review" && focusBookingId === booking.id;

    return (
      <div
        id={`booking-${booking.id}`}
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

              {booking.status === "COMPLETED" ? (
                booking.hasOwnerReviewed ? (
                  <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Reviewed ✓
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Review pending
                  </span>
                )
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

            {canShowAccessInstructions &&
            ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status) ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-900">
                  Access instructions for supplier
                </p>

                <textarea
                  rows={3}
                  value={
                    accessInstructionInputs[booking.id] ??
                    booking.accessInstructions ??
                    ""
                  }
                  onChange={(e) =>
                    setAccessInstructionInputs((prev) => ({
                      ...prev,
                      [booking.id]: e.target.value,
                    }))
                  }
                  placeholder="Gate code, parking, key access, security notes..."
                  className="mt-2 w-full rounded-lg border border-blue-200 p-2 text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    updateAccessInstructionsMutation.mutate({
                      bookingId: booking.id,
                      accessInstructions:
                        accessInstructionInputs[booking.id] ??
                        booking.accessInstructions ??
                        "",
                    })
                  }
                  disabled={updateAccessInstructionsMutation.isPending}
                  className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {updateAccessInstructionsMutation.isPending
                    ? "Saving..."
                    : "Save access instructions"}
                </button>
                {savedAccessInstructionId === booking.id ? (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    Access instructions sent ✓
                  </p>
                ) : null}
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

            {booking.status === "COMPLETED" && !booking.hasOwnerReviewed ? (
              <div
                id={`review-${booking.id}`}
                className={`rounded-lg border p-3 ${
                  highlightReview
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <p className="text-sm font-medium text-green-900">
                  Rate this booking
                </p>

                <select
                  value={reviewInputs[booking.id]?.rating || ""}
                  onChange={(e) =>
                    setReviewInputs((prev) => ({
                      ...prev,
                      [booking.id]: {
                        rating: e.target.value,
                        comment: prev[booking.id]?.comment || "",
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-green-200 p-2 text-sm"
                >
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Okay</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very poor</option>
                </select>

                <textarea
                  rows={3}
                  value={reviewInputs[booking.id]?.comment || ""}
                  onChange={(e) =>
                    setReviewInputs((prev) => ({
                      ...prev,
                      [booking.id]: {
                        rating: prev[booking.id]?.rating || "",
                        comment: e.target.value,
                      },
                    }))
                  }
                  placeholder="Optional comment"
                  className="mt-2 w-full rounded-lg border border-green-200 p-2 text-sm"
                />

                <button
                  type="button"
                  disabled={
                    !reviewInputs[booking.id]?.rating ||
                    submitReviewMutation.isPending
                  }
                  onClick={() =>
                    submitReviewMutation.mutate({
                      bookingId: booking.id,
                      rating: reviewInputs[booking.id]?.rating || "",
                      comment: reviewInputs[booking.id]?.comment || "",
                    })
                  }
                  className="mt-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {submitReviewMutation.isPending ? "Submitting..." : "Submit review"}
                </button>
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
              Manage your Dog Passport, bookings, care reminders and trusted dog
              services — all in one place.
            </p>
          </div>

          <Link
            to="/owner/my-dogs"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {hasDogs ? "View Dog Passport" : "Create Dog Passport"}
          </Link>
        </div>
      </div>

      <OwnerBookingJourney hasDogs={hasDogs} />

      {!isDogsLoading && !hasDogs ? <DogProfilePrompt /> : null}

      <ServiceShortcuts hasDogs={hasDogs} />

      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((n: any) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`cursor-pointer rounded-lg border p-4 ${
                n.read
                  ? "border-gray-200 bg-gray-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <p className="font-semibold text-gray-800">{n.title}</p>
              <p className="text-sm text-gray-600">
                {n.booking
                  ? `${n.booking.serviceLabel} with ${
                      n.booking.dogNames || "your dog"
                    } on ${formatDate(n.booking.startAt)}`
                  : n.message}
              </p>
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