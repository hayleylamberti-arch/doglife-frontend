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
  if (cents === null || cents === undefined) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function firstNameOnly(value?: string | null) {
  if (!value) return "";
  return String(value).trim().split(/\s+/)[0];
}

function firstNamesOnlyList(value?: string | null) {
  if (!value) return "";

  return String(value)
    .split(",")
    .map((name) => firstNameOnly(name))
    .filter(Boolean)
    .join(", ");
}

function formatLabel(value?: string | null) {
  if (!value) return "";

  const labelMap: Record<string, string> = {
    OWNER_HOME: "Owner’s home",
    SUPPLIER_HOME: "Supplier’s premises",
    SUPPLIER_LOCATION: "Supplier’s premises",
    SITTER_HOME: "Sitter’s home",
    HALF_DAY: "Half Day",
    FULL_DAY: "Full Day",
    MORNING: "Morning",
    AFTERNOON: "Afternoon",
    RETURN: "Return Journey",
    ONE_WAY: "One-way Journey",
    WASH_BRUSH_SMALL: "Wash & Brush (Small)",
    WASH_BRUSH_MEDIUM: "Wash & Brush (Medium)",
    WASH_BRUSH_LARGE: "Wash & Brush (Large)",
    WASH_CUT_SMALL: "Wash & Cut (Small)",
    WASH_CUT_MEDIUM: "Wash & Cut (Medium)",
    WASH_CUT_LARGE: "Wash & Cut (Large)",
  };

  if (labelMap[value]) return labelMap[value];

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatServiceLabel(value?: string | null) {
  const serviceMap: Record<string, string> = {
    WALKING: "Dog Walking",
    TRAINING: "Dog Training",
    GROOMING: "Dog Grooming",
    BOARDING: "Dog Boarding",
    DAYCARE: "Doggy Daycare",
    PET_SITTING: "Pet Sitting",
    PET_TRANSPORT: "Pet Transport",
    MOBILE_VET: "Mobile Vet",
  };

  if (!value) return "Service";
  return serviceMap[value] || formatLabel(value);
}

function formatBookingStatusLabel(status: string) {
  const statusMap: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In Progress",
    COMPLETED_UNBILLED: "Awaiting Payment",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return statusMap[status] || formatLabel(status);
}

function formatNoteLabel(label: string) {
  return formatLabel(label.trim());
}

function formatNoteValue(value: string) {
  return formatLabel(value.trim());
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

    const isGroomingSelectionLine =
      /^[a-z\s'-]+-\s*(wash brush|wash cut),?\s*(small|medium|large|x large|xl)?$/.test(
        lower
      );

    if (isGroomingSelectionLine) {
      return;
    }

    if (
      lower.startsWith("grooming option:") ||
      lower.startsWith("grooming selections:") ||
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
      lower.startsWith("owner address:")
    ) {
      addresses.push(part);
      return;
    }

    if (
      lower.startsWith("supplier address:") ||
      lower.startsWith("access instructions:") ||
      lower.startsWith("gate code:") ||
      lower.startsWith("estate access:") ||
      lower.startsWith("alarm:") ||
      lower.startsWith("key:") ||
      lower.startsWith("service location:") ||
      lower.startsWith("training location:") ||
      lower.startsWith("mobile grooming") ||
      lower === "mobile grooming" ||
      lower === "owner home" ||
      lower === "owner_home" ||
      lower === "supplier location" ||
      lower === "supplier_location"
    ) {
      return;
    }

    general.push(part);
  });

  return { details, addresses, general };
}

function cleanAddressForDisplay(address: string) {
  return address
    .replace(/^Owner address:\s*/i, "")
    .replace(/^Supplier address:\s*/i, "")
    .replace(/^Service address:\s*/i, "")
    .replace(/^Pickup point:\s*/i, "Pickup: ")
    .replace(/^Drop-off point:\s*/i, "Drop-off: ")
    .replace(/^Pickup address:\s*/i, "Pickup: ")
    .replace(/^Drop-off address:\s*/i, "Drop-off: ")
    .trim();
}

function formatGroomingSelection(value: string) {
  return value
    .split(/\s*;\s*|\s*\|\s*/)
    .map((selection) => {
      const trimmed = selection.trim();

      const match = trimmed.match(
        /^(.+?)\s*-\s*(wash brush|wash cut),?\s*(small|medium|large|x large|xl)$/i
      );

      if (!match) {
        return trimmed
          .replace(/\bWash Brush\b/gi, "Wash & Brush")
          .replace(/\bWash Cut\b/gi, "Wash & Cut");
      }

      const [, dogName, service, size] = match;

      const formattedService =
        service.toLowerCase() === "wash brush"
          ? "Wash & Brush"
          : "Wash & Cut";

      const formattedSize =
        size.toLowerCase() === "xl"
          ? "XL"
          : size
              .toLowerCase()
              .replace(/\b\w/g, (character) => character.toUpperCase());

      return `${firstNameOnly(dogName)}: ${formattedService} (${formattedSize})`;
    })
    .filter(Boolean)
    .join(" • ");
}

function formatBookingDetail(detail: string) {
  const [rawLabel, ...rest] = detail.split(":");
  const rawValue = rest.join(":").trim();
  const label = rawLabel.trim();
  const lowerLabel = label.toLowerCase();

  if (
    lowerLabel === "grooming selections" ||
    lowerLabel === "grooming option"
  ) {
    return {
      label: "Grooming",
      value: formatGroomingSelection(rawValue),
    };
  }

  return {
    label,
    value: rawValue,
  };
}

function canShowAccessInstructions(booking: any) {
  return (
    booking.serviceLocationSummary?.type === "OWNER_HOME" ||
    booking.serviceLocationSummary?.type === "TRANSPORT"
  );
}

function getOwnerReviewPrompt(booking: any) {
  const supplierName = booking.supplier?.businessName || "your supplier";
  const service = booking.supplierService?.service || booking.serviceType;

  const serviceMap: Record<string, string> = {
    WALKING: "dog walking",
    TRAINING: "training",
    GROOMING: "grooming",
    BOARDING: "boarding",
    DAYCARE: "daycare",
    PET_SITTING: "pet sitting",
    PET_TRANSPORT: "pet transport",
    MOBILE_VET: "mobile vet",
  };

  const serviceText = serviceMap[service] || "service";

  return `How was your ${serviceText} experience with ${supplierName}?`;
}

function BookingMetaPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
      <span className="mr-1 font-medium">{formatNoteLabel(label)}:</span>
      <span>
        {label.toLowerCase() === "grooming"
          ? value
          : formatNoteValue(value)}
      </span>
    </span>
  );
}

function TransportJourneyDetails({ booking }: { booking: any }) {
  const location = booking.serviceLocationSummary;
  const transportAreas = booking.transportAreaSummary;

  const isReturnJourney = booking.journeyType === "RETURN";

  const pickupArea =
    transportAreas?.pickupSuburb || booking.pickupSuburb || null;

  const dropoffArea =
    transportAreas?.dropoffSuburb || booking.dropoffSuburb || null;

  const hasExactJourneyDetails =
    location?.type === "TRANSPORT" &&
    (location.pickupAddress || location.dropoffAddress);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      <p className="font-medium">
        {hasExactJourneyDetails
          ? "Journey details"
          : isReturnJourney
          ? "Return journey"
          : "One-way journey"}
      </p>

      <div className="mt-3">
        <p className="font-medium text-blue-900">Outbound journey</p>

        {hasExactJourneyDetails ? (
          <div className="mt-2 space-y-2">
            {location.pickupAddress ? (
              <div>
                <span className="font-medium">Pickup:</span>
                <div className="whitespace-pre-line">
                  {location.pickupAddress}
                </div>
              </div>
            ) : null}

            {location.dropoffAddress ? (
              <div>
                <span className="font-medium">Drop-off:</span>
                <div className="whitespace-pre-line">
                  {location.dropoffAddress}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            {pickupArea ? (
              <p>
                <span className="font-medium">Pickup area:</span>{" "}
                {pickupArea}
              </p>
            ) : null}

            {dropoffArea ? (
              <p>
                <span className="font-medium">Drop-off area:</span>{" "}
                {dropoffArea}
              </p>
            ) : null}

            {!pickupArea && !dropoffArea ? (
              <p className="text-blue-700">
                Journey areas have not been provided.
              </p>
            ) : null}

            <p className="pt-2 text-xs text-blue-700">
              Exact addresses will be available once the booking is confirmed.
            </p>
          </div>
        )}
      </div>

      {isReturnJourney ? (
        <div className="mt-4 border-t border-blue-200 pt-3">
          <p className="font-medium text-blue-900">Return journey</p>

          {booking.returnStartAt && booking.returnEndAt ? (
            <p className="mt-1">
              {formatDate(booking.returnStartAt)} •{" "}
              {formatTime(booking.returnStartAt)} –{" "}
              {formatTime(booking.returnEndAt)}
            </p>
          ) : null}

          {hasExactJourneyDetails ? (
            <div className="mt-2 space-y-2">
              {location.dropoffAddress ? (
                <div>
                  <span className="font-medium">Pickup:</span>
                  <div className="whitespace-pre-line">
                    {location.dropoffAddress}
                  </div>
                </div>
              ) : null}

              {location.pickupAddress ? (
                <div>
                  <span className="font-medium">Drop-off:</span>
                  <div className="whitespace-pre-line">
                    {location.pickupAddress}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              {dropoffArea ? (
                <p>
                  <span className="font-medium">Pickup area:</span>{" "}
                  {dropoffArea}
                </p>
              ) : null}

              {pickupArea ? (
                <p>
                  <span className="font-medium">Drop-off area:</span>{" "}
                  {pickupArea}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function OwnerServiceAddress({
  booking,
  legacyAddresses,
}: {
  booking: any;
  legacyAddresses: string[];
}) {
  const location = booking.serviceLocationSummary;

  if (
    booking.serviceType === "PET_TRANSPORT" ||
    booking.supplierService?.service === "PET_TRANSPORT"
  ) {
    return null;
  }

  if (location?.addressLine) {
    const cleanAddress = String(location.addressLine)
      .replace(/^Owner address:\s*/i, "")
      .replace(/^Supplier address:\s*/i, "")
      .replace(/^Service address:\s*/i, "")
      .trim();

    if (!cleanAddress) return null;

    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm font-medium text-blue-900">
          Service address
        </p>

        <p className="mt-1 whitespace-pre-line text-sm text-blue-800">
          {cleanAddress}
        </p>
      </div>
    );
  }

  const cleanedLegacyAddresses = legacyAddresses
    .map(cleanAddressForDisplay)
    .filter(Boolean);

  if (cleanedLegacyAddresses.length > 0) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm font-medium text-blue-900">
          Service address
        </p>

        <div className="mt-1 space-y-1">
          {cleanedLegacyAddresses.map((address) => (
            <p
              key={address}
              className="whitespace-pre-line text-sm text-blue-800"
            >
              {address}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (booking.serviceArea) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm font-medium text-blue-900">
          Service area
        </p>

        <p className="mt-1 text-sm text-blue-800">
          {booking.serviceArea}
        </p>
      </div>
    );
  }

  return null;
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
  renderBookingCard: (
    booking: any,
    isToday?: boolean
  ) => React.ReactNode;
  titleColor?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (bookings.length === 0) return null;

  return (
    <section
      id={id}
      className="rounded-2xl border border-gray-200 bg-white p-4"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h3
            className={`text-lg font-semibold ${
              titleColor || "text-gray-900"
            }`}
          >
            {title}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {bookings.length} booking
            {bookings.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {bookings.length}
          </span>

          <span className="text-xl text-gray-500">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-4">
          {bookings.map((booking: any) =>
            renderBookingCard(booking)
          )}
        </div>
      ) : null}
    </section>
  );
}

const SERVICE_SHORTCUTS = [
  {
    key: "WALKING",
    label: "Walking",
    icon: "🐾",
    href: "/search?service=WALKING",
  },
  {
    key: "TRAINING",
    label: "Training",
    icon: "🎓",
    href: "/search?service=TRAINING",
  },
  {
    key: "GROOMING",
    label: "Grooming",
    icon: "✂️",
    href: "/search?service=GROOMING",
  },
  {
    key: "BOARDING",
    label: "Boarding",
    icon: "🏠",
    href: "/search?service=BOARDING",
  },
  {
    key: "DAYCARE",
    label: "Daycare",
    icon: "☀️",
    href: "/search?service=DAYCARE",
  },
  {
    key: "PET_SITTING",
    label: "Pet Sitting",
    icon: "🩷",
    href: "/search?service=PET_SITTING",
  },
  {
    key: "PET_TRANSPORT",
    label: "Transport",
    icon: "🚗",
    href: "/search?service=PET_TRANSPORT",
  },
  {
    key: "MOBILE_VET",
    label: "Mobile Vet",
    icon: "🩺",
    href: "/search?service=MOBILE_VET",
  },
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

function OwnerProfilePrompt() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-blue-900">
        Complete your owner profile 📍
      </h2>

      <p className="mt-2 text-sm text-blue-800">
        Add your suburb and home address so DogLife can show nearby
        providers and prepare home-based services like walking, grooming,
        training and mobile vet visits.
      </p>

      <Link
        to="/owner/profile"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Complete owner profile
      </Link>
    </div>
  );
}

function ServiceShortcuts({ hasDogs }: { hasDogs: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Book a service
          </h2>

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

              <p className="mt-1 text-xs text-gray-500">
                {step.text}
              </p>
            </>
          );

          return step.href ? (
            <Link
              key={step.title}
              to={step.href}
              className={cardClass}
            >
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

  const [openSections, setOpenSections] = useState<
    Record<string, boolean>
  >({
    today: true,
    pending: true,
    confirmed: true,
    "in-progress": false,
    "completed-unbilled": false,
    completed: false,
    cancelled: false,
  });

  const [accessInstructionInputs, setAccessInstructionInputs] =
    useState<Record<string, string>>({});

  const [savedAccessInstructionId, setSavedAccessInstructionId] =
    useState<string | null>(null);

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

  const {
    data: ownerProfileData,
    isLoading: isOwnerProfileLoading,
  } = useQuery({
    queryKey: ["owner-profile"],
    queryFn: async () => {
      const res = await api.get("/api/owner/profile");
      return res.data?.profile || null;
    },
  });

  const dogs = dogsData?.dogs || [];
  const hasDogs = dogs.length > 0;

  const hasOwnerSuburb = Boolean(ownerProfileData?.suburb?.trim());
  const hasOwnerAddress = Boolean(ownerProfileData?.address?.trim());
  const hasOwnerProfile = hasOwnerSuburb && hasOwnerAddress;

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
      await api.patch(
        `/api/bookings/${bookingId}/access-instructions`,
        {
          accessInstructions,
        }
      );
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
        new Date(b.startAt).getTime() -
        new Date(a.startAt).getTime()
    );
  }, [data]);

  const todayBookings = useMemo(
    () =>
      sortedBookings.filter((booking: any) => {
        const bookingDate = new Date(booking.startAt);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
      }),
    [sortedBookings, todayStart, todayEnd]
  );

  const todayBookingIds = useMemo(
    () => new Set(todayBookings.map((booking: any) => booking.id)),
    [todayBookings]
  );

  const pendingBookings = useMemo(
    () =>
      sortedBookings.filter(
        (booking: any) =>
          booking.status === "PENDING" &&
          !todayBookingIds.has(booking.id)
      ),
    [sortedBookings, todayBookingIds]
  );

  const confirmedBookings = useMemo(
    () =>
      sortedBookings.filter(
        (booking: any) =>
          booking.status === "CONFIRMED" &&
          !todayBookingIds.has(booking.id)
      ),
    [sortedBookings, todayBookingIds]
  );

  const inProgressBookings = useMemo(
    () =>
      sortedBookings.filter(
        (booking: any) =>
          booking.status === "IN_PROGRESS" &&
          !todayBookingIds.has(booking.id)
      ),
    [sortedBookings, todayBookingIds]
  );

  const completedAwaitingPaymentBookings = useMemo(
    () =>
      sortedBookings.filter(
        (booking: any) =>
          booking.status === "COMPLETED_UNBILLED" &&
          !todayBookingIds.has(booking.id)
      ),
    [sortedBookings, todayBookingIds]
  );

  const completedPaidBookings = useMemo(
    () =>
      sortedBookings.filter(
        (booking: any) =>
          booking.status === "COMPLETED" &&
          !todayBookingIds.has(booking.id)
      ),
    [sortedBookings, todayBookingIds]
  );

  const cancelledBookings = useMemo(
    () =>
      sortedBookings.filter(
        (booking: any) =>
          booking.status === "CANCELLED" &&
          !todayBookingIds.has(booking.id)
      ),
    [sortedBookings, todayBookingIds]
  );

  const bookingSections = useMemo(
    () => [
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
        title: "In Progress",
        bookings: inProgressBookings,
        titleColor: "text-blue-700",
        isToday: false,
      },
      {
        key: "completed-unbilled",
        title: "Awaiting Payment",
        bookings: completedAwaitingPaymentBookings,
        titleColor: "text-purple-700",
        isToday: false,
      },
      {
        key: "completed",
        title: "Completed",
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
    ],
    [
      todayBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedAwaitingPaymentBookings,
      completedPaidBookings,
      cancelledBookings,
    ]
  );

  const hasAnyBookings = bookingSections.some(
    (section) => section.bookings.length > 0
  );

  const summaryItems = [
    {
      key: "today",
      label: "Today",
      count: todayBookings.length,
      textClass: "text-blue-600",
    },
    {
      key: "pending",
      label: "Pending",
      count: pendingBookings.length,
      textClass: "text-amber-600",
    },
    {
      key: "confirmed",
      label: "Confirmed",
      count: confirmedBookings.length,
      textClass: "text-green-600",
    },
    {
      key: "in-progress",
      label: "In Progress",
      count: inProgressBookings.length,
      textClass: "text-blue-600",
    },
    {
      key: "completed-unbilled",
      label: "Awaiting Payment",
      count: completedAwaitingPaymentBookings.length,
      textClass: "text-purple-600",
    },
  ];

  function toggleSection(sectionKey: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  function openAndScroll(sectionKey: string) {
    const section = bookingSections.find(
      (item) => item.key === sectionKey
    );

    if (!section || section.bookings.length === 0) return;

    setOpenSections((current) => ({
      ...current,
      [sectionKey]: true,
    }));

    window.setTimeout(() => {
      document.getElementById(sectionKey)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleNotificationClick(notification: any) {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    const bookingId =
      notification.referenceId || notification.booking?.id;

    if (!bookingId) return;

    const section = bookingSections.find((bookingSection) =>
      bookingSection.bookings.some(
        (booking: any) => booking.id === bookingId
      )
    );

    if (section) {
      setOpenSections((current) => ({
        ...current,
        [section.key]: true,
      }));
    }

    window.setTimeout(() => {
      const isReviewNotification = String(
        notification.title || ""
      )
        .toLowerCase()
        .includes("review");

      const targetId = isReviewNotification
        ? `review-${bookingId}`
        : `booking-${bookingId}`;

      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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

    setOpenSections((current) => ({
      ...current,
      [section.key]: true,
    }));

    const targetId =
      focusAction === "review"
        ? `review-${focusBookingId}`
        : `booking-${focusBookingId}`;

    const scrollToBooking = () => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    window.setTimeout(scrollToBooking, 300);
    window.setTimeout(scrollToBooking, 800);
    window.setTimeout(scrollToBooking, 1200);
  }, [focusBookingId, focusAction, bookingSections]);

  const renderBookingCard = (
    booking: any,
    isToday = false
  ) => {
    const supplierMessage =
      booking.status === "CANCELLED"
        ? getSupplierMessage(booking)
        : null;

    const parsedNotes = parseBookingNotes(booking.notes);

    const isTransportBooking =
      booking.serviceType === "PET_TRANSPORT" ||
      booking.supplierService?.service === "PET_TRANSPORT";

    const showAccessInstructions =
      canShowAccessInstructions(booking) &&
      ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(
        booking.status
      );

    const highlightReview =
      focusAction === "review" &&
      focusBookingId === booking.id;

    return (
      <div
        id={`booking-${booking.id}`}
        key={booking.id}
        className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
          focusBookingId === booking.id
            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
            : isToday
            ? "border-blue-200 bg-blue-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {booking.supplier?.businessName ||
                  "Service Provider"}
              </p>

              <p className="text-sm text-gray-500">
                {formatDate(booking.startAt)} •{" "}
                {formatTime(booking.startAt)} –{" "}
                {formatTime(booking.endAt)}
              </p>

              {isTransportBooking ? (
                <>
                  <p className="mt-1 text-sm text-gray-600">
                    {booking.journeyType === "RETURN"
                      ? "Return journey"
                      : "One-way journey"}
                  </p>

                  {booking.journeyType === "RETURN" &&
                  booking.returnStartAt &&
                  booking.returnEndAt ? (
                    <p className="mt-1 text-sm text-gray-500">
                      Return:{" "}
                      {formatDate(booking.returnStartAt)} •{" "}
                      {formatTime(booking.returnStartAt)} –{" "}
                      {formatTime(booking.returnEndAt)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {formatServiceLabel(
                  booking.supplierService?.service ||
                    booking.serviceType
                )}
              </span>

              {booking.supplierService?.unit ? (
                <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  {formatLabel(
                    String(
                      booking.supplierService.unit
                    ).replace(/^PER_/, "")
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
                ? booking.dogs
                    .map((item: any) =>
                      firstNameOnly(item?.dog?.name)
                    )
                    .filter(Boolean)
                    .join(", ")
                : "No dogs selected"}
            </p>

            {!isTransportBooking &&
            parsedNotes.details.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsedNotes.details.map((detail) => {
                  const formattedDetail =
                    formatBookingDetail(detail);

                  return (
                    <BookingMetaPill
                      key={detail}
                      label={formattedDetail.label}
                      value={formattedDetail.value}
                    />
                  );
                })}
              </div>
            ) : null}

            {isTransportBooking ? (
              <TransportJourneyDetails booking={booking} />
            ) : (
              <OwnerServiceAddress
                booking={booking}
                legacyAddresses={parsedNotes.addresses}
              />
            )}

            {!isTransportBooking &&
            parsedNotes.general.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">
                  Notes
                </p>

                <div className="mt-2 space-y-1">
                  {parsedNotes.general.map((note) => (
                    <p
                      key={note}
                      className="text-sm text-gray-700"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {showAccessInstructions ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-900">
                  Access instructions
                </p>

                <textarea
                  rows={3}
                  value={
                    accessInstructionInputs[booking.id] ??
                    booking.accessInstructions ??
                    ""
                  }
                  onChange={(event) =>
                    setAccessInstructionInputs((current) => ({
                      ...current,
                      [booking.id]: event.target.value,
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
                  disabled={
                    updateAccessInstructionsMutation.isPending
                  }
                  className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {updateAccessInstructionsMutation.isPending
                    ? "Saving..."
                    : "Save access instructions"}
                </button>

                {savedAccessInstructionId === booking.id ? (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    ✅ Access instructions sent
                  </p>
                ) : null}
              </div>
            ) : null}

            {supplierMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  Supplier message
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {supplierMessage}
                </p>
              </div>
            ) : null}

            {booking.status === "COMPLETED" &&
            !booking.hasOwnerReviewed ? (
              <div
                id={`review-${booking.id}`}
                className={`rounded-lg border p-3 ${
                  highlightReview
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <p className="text-sm font-medium text-green-900">
                  {getOwnerReviewPrompt(booking)}
                </p>

                <select
                  value={
                    reviewInputs[booking.id]?.rating || ""
                  }
                  onChange={(event) =>
                    setReviewInputs((current) => ({
                      ...current,
                      [booking.id]: {
                        rating: event.target.value,
                        comment:
                          current[booking.id]?.comment || "",
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
                  value={
                    reviewInputs[booking.id]?.comment || ""
                  }
                  onChange={(event) =>
                    setReviewInputs((current) => ({
                      ...current,
                      [booking.id]: {
                        rating:
                          current[booking.id]?.rating || "",
                        comment: event.target.value,
                      },
                    }))
                  }
                  placeholder="Share anything helpful about your experience..."
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
                      rating:
                        reviewInputs[booking.id]?.rating || "",
                      comment:
                        reviewInputs[booking.id]?.comment || "",
                    })
                  }
                  className="mt-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {submitReviewMutation.isPending
                    ? "Submitting..."
                    : "Submit review"}
                </button>
              </div>
            ) : null}

            {booking.status === "COMPLETED" &&
            booking.hasOwnerReviewed ? (
              <p
                id={`review-${booking.id}`}
                className={`text-sm font-medium ${
                  highlightReview
                    ? "text-blue-700"
                    : "text-green-700"
                }`}
              >
                ✅ Thank you for your review
              </p>
            ) : null}
          </div>

          <div className="shrink-0 space-y-3 text-left md:text-right">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                booking.status
              )}`}
            >
              {formatBookingStatusLabel(booking.status)}
            </span>

            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(booking.totalCents)}
            </p>

            {(booking.status === "PENDING" ||
              booking.status === "CONFIRMED") && (
              <button
                type="button"
                onClick={() =>
                  cancelBookingMutation.mutate(booking.id)
                }
                disabled={cancelBookingMutation.isPending}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {cancelBookingMutation.isPending
                  ? "Cancelling..."
                  : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to DogLife 🐾
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage your Dog Passport, bookings, care reminders and
              trusted dog services — all in one place.
            </p>
          </div>

          <Link
            to="/owner/my-dogs"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {hasDogs
              ? "View Dog Passport"
              : "Create Dog Passport"}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => openAndScroll(item.key)}
            disabled={item.count === 0}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm disabled:cursor-default disabled:opacity-70"
          >
            <p className="text-xs text-gray-500 sm:text-sm">
              {item.label}
            </p>

            <p
              className={`mt-2 text-2xl font-bold sm:text-3xl ${item.textClass}`}
            >
              {item.count}
            </p>
          </button>
        ))}
      </div>

      <OwnerBookingJourney hasDogs={hasDogs} />

      {!isOwnerProfileLoading && !hasOwnerProfile ? (
        <OwnerProfilePrompt />
      ) : null}

      {!isDogsLoading && !hasDogs ? (
        <DogProfilePrompt />
      ) : null}

      <ServiceShortcuts
        hasDogs={hasDogs && hasOwnerProfile}
      />

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification: any) => (
            <button
              key={notification.id}
              type="button"
              onClick={() =>
                handleNotificationClick(notification)
              }
              className={`w-full cursor-pointer rounded-lg border p-4 text-left ${
                notification.read
                  ? "border-gray-200 bg-gray-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <p className="font-semibold text-gray-800">
                {notification.title}
              </p>

              <p className="text-sm text-gray-600">
                {notification.booking
                  ? `${formatServiceLabel(
                      notification.booking.serviceLabel
                    )} with ${
                      firstNamesOnlyList(
                        notification.booking.dogNames
                      ) || "your dog"
                    } on ${formatDate(
                      notification.booking.startAt
                    )}`
                  : notification.message}
              </p>
            </button>
          ))}
        </div>
      ) : null}

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
                  renderBookingCard(
                    booking,
                    section.isToday
                  )
                }
                titleColor={section.titleColor}
                isOpen={Boolean(
                  openSections[section.key]
                )}
                onToggle={() =>
                  toggleSection(section.key)
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}