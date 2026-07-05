import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    size?: string | null;
    sex?: string | null;
    isNeutered?: boolean | null;
    behavioralNotes?: string | null;
    goodWithDogs?: boolean | null;
    goodWithChildren?: boolean | null;
    medicalNotes?: string | null;
    isVaccinated?: boolean | null;
    vaccinationExpiryDate?: string | null;
    kennelCoughAt?: string | null;
    dewormedAt?: string | null;
    tickFleaTreatedAt?: string | null;
    vetName?: string | null;
    vetPhone?: string | null;
  };
};

type BookingEvent = {
  id: string;
  type: string;
  message?: string | null;
  createdAt?: string;
};

type BookingReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
};

type ReviewInput = {
  rating: string;
  comment: string;
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
  serviceArea?: string | null;
  notes?: string | null;
  accessInstructions?: string | null;
  accessInstructionsUpdatedAt?: string | null;
  completedAt?: string | null;
  serviceLocationSummary?: ServiceLocationSummary | null;
  supplierReview?: BookingReview | null;
  hasSupplierReviewed?: boolean;
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function yesNo(value?: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function formatMoney(cents?: number | null) {
  const amount = Number(cents || 0) / 100;
  return `R${amount.toFixed(0)}`;
}

function firstNameOnly(value?: string | null) {
  if (!value) return "";
  return String(value).trim().split(/\s+/)[0];
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
      ?.map((item) => firstNameOnly(item?.dog?.name))
      .filter(Boolean)
      .join(", ") || "No dogs linked"
  );
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

function formatServiceName(value?: string | null) {
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

  if (!value) return "Booking";
  return serviceMap[value] || formatLabel(value);
}

function formatBookingStatusLabel(status: BookingStatus) {
  const statusMap: Record<BookingStatus, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In Progress",
    COMPLETED_UNBILLED: "Awaiting Payment",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return statusMap[status] || formatLabel(status);
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

function cleanNotesForDisplay(notes?: string | null) {
  if (!notes) return null;

  const cleaned = String(notes)
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const lower = part.toLowerCase();

      return !(
        lower.startsWith("owner address:") ||
        lower.startsWith("supplier address:") ||
        lower.startsWith("service address:") ||
        lower.startsWith("pickup point:") ||
        lower.startsWith("drop-off point:") ||
        lower.startsWith("pickup address:") ||
        lower.startsWith("drop-off address:") ||
        lower.startsWith("access instructions:") ||
        lower.startsWith("gate code:") ||
        lower.startsWith("estate access:") ||
        lower.startsWith("alarm:") ||
        lower.startsWith("key:") ||
        lower.startsWith("service location:") ||
        lower.startsWith("training location:") ||
        lower.startsWith("grooming option:") ||
        lower.startsWith("grooming selections:") ||
        lower.startsWith("size:") ||
        lower.startsWith("daycare type:") ||
        lower.startsWith("half day period:") ||
        lower.startsWith("mobile vet service:") ||
        lower.startsWith("pet sitting location:") ||
        lower.startsWith("kennel type:") ||
        lower.startsWith("journey type:") ||
        lower === "owner home" ||
        lower === "owner_home" ||
        lower === "supplier location" ||
        lower === "supplier_location"
      );
    })
    .join(". ")
    .trim();

  return cleaned ? `${cleaned}.` : null;
}

function sortBookingsByStart(bookings: SupplierBooking[]) {
  return [...bookings].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
}

function isTodayBooking(
  booking: SupplierBooking,
  todayStart: Date,
  todayEnd: Date
) {
  const date = new Date(booking.startAt);
  return date >= todayStart && date <= todayEnd;
}

function LocationSummary({ booking }: { booking: SupplierBooking }) {
  const location = booking.serviceLocationSummary;

  if (!location) {
    if (booking.serviceArea) {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <div className="font-medium">Service area</div>
          <div className="mt-1">{booking.serviceArea}</div>
        </div>
      );
    }

    return null;
  }

  if (location.type === "TRANSPORT") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <div className="font-medium">Pickup and drop-off</div>
        {location.pickupAddress ? (
          <div className="mt-1 whitespace-pre-line">
            Pickup: {location.pickupAddress}
          </div>
        ) : null}
        {location.dropoffAddress ? (
          <div className="mt-1 whitespace-pre-line">
            Drop-off: {location.dropoffAddress}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      <div className="font-medium">
        {location.label ? formatLabel(location.label) : "Service location"}
      </div>

      {location.addressLine ? (
        <div className="mt-1 whitespace-pre-line">{location.addressLine}</div>
      ) : booking.serviceArea ? (
        <div className="mt-1">{booking.serviceArea}</div>
      ) : (
        <div className="mt-1 text-blue-700">Location details not provided.</div>
      )}
    </div>
  );
}

function DogDetails({ booking }: { booking: SupplierBooking }) {
  const [isOpen, setIsOpen] = useState(false);
  const dogs = booking.dogs?.map((item) => item.dog).filter(Boolean) || [];

  if (!dogs.length) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-950">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between p-3 text-left font-semibold"
      >
        <span>
          Dog care details ({dogs.length} dog{dogs.length === 1 ? "" : "s"})
        </span>
        <span>{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="space-y-3 p-3 pt-0">
          {dogs.map((dog) => (
            <div
              key={dog!.id}
              className="rounded-lg border border-amber-200 bg-white p-3"
            >
              <div className="font-medium">{firstNameOnly(dog!.name)}</div>

              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <div>Breed: {dog!.breed || "—"}</div>
                <div>Size: {formatLabel(dog!.size) || "—"}</div>
                <div>Sex: {formatLabel(dog!.sex) || "—"}</div>
                <div>Neutered: {yesNo(dog!.isNeutered)}</div>
                <div>Vaccinated: {yesNo(dog!.isVaccinated)}</div>
                <div>Good with dogs: {yesNo(dog!.goodWithDogs)}</div>
                <div>Good with children: {yesNo(dog!.goodWithChildren)}</div>

                {booking.status !== "PENDING" ? (
                  <>
                    <div>
                      Vaccination expiry: {formatDate(dog!.vaccinationExpiryDate)}
                    </div>
                    <div>Kennel cough: {formatDate(dog!.kennelCoughAt)}</div>
                    <div>Dewormed: {formatDate(dog!.dewormedAt)}</div>
                    <div>
                      Tick/flea treated: {formatDate(dog!.tickFleaTreatedAt)}
                    </div>
                    <div>Vet: {dog!.vetName || "—"}</div>
                    <div>Vet phone: {dog!.vetPhone || "—"}</div>
                  </>
                ) : null}

                <div className="sm:col-span-2">
                  Behaviour notes: {dog!.behavioralNotes || "—"}
                </div>
                <div className="sm:col-span-2">
                  Medical notes: {dog!.medicalNotes || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getSupplierReviewPrompt(booking: SupplierBooking) {
  const ownerName = formatOwnerName(booking);
  const dogNames = formatDogNames(booking);

  if (dogNames && dogNames !== "No dogs linked") {
    return `How was your experience working with ${ownerName} and ${dogNames}?`;
  }

  return `How was your experience working with ${ownerName}?`;
}

function SupplierOwnerReview({
  booking,
  reviewInput,
  isSubmitting,
  onChange,
  onSubmit,
  highlight,
}: {
  booking: SupplierBooking;
  reviewInput?: ReviewInput;
  isSubmitting: boolean;
  onChange: (bookingId: string, values: ReviewInput) => void;
  onSubmit: (bookingId: string) => void;
  highlight?: boolean;
}) {
  if (booking.status !== "COMPLETED") return null;

  if (booking.hasSupplierReviewed) {
    return (
      <div
        id={`review-${booking.id}`}
        className={`rounded-lg border p-3 text-sm font-medium ${
          highlight
            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200 text-blue-700"
            : "border-green-200 bg-green-50 text-green-700"
        }`}
      >
        ✅ Review submitted
      </div>
    );
  }

  const currentInput = reviewInput || { rating: "", comment: "" };

  return (
    <div
      id={`review-${booking.id}`}
      className={`rounded-lg border p-3 text-sm ${
        highlight
          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
          : "border-green-200 bg-green-50"
      }`}
    >
      <p className="font-medium text-green-900">
        {getSupplierReviewPrompt(booking)}
      </p>

      <select
        value={currentInput.rating}
        onChange={(event) =>
          onChange(booking.id, {
            rating: event.target.value,
            comment: currentInput.comment,
          })
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
        value={currentInput.comment}
        onChange={(event) =>
          onChange(booking.id, {
            rating: currentInput.rating,
            comment: event.target.value,
          })
        }
        placeholder="Share anything helpful about the booking..."
        className="mt-2 w-full rounded-lg border border-green-200 p-2 text-sm"
      />

      <button
        type="button"
        disabled={!currentInput.rating || isSubmitting}
        onClick={() => onSubmit(booking.id)}
        className="mt-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </button>
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
  reviewInput,
  reviewLoading,
  onReviewChange,
  onSubmitReview,
  highlightReview,
}: {
  booking: SupplierBooking;
  onAccept: (bookingId: string) => void;
  onDecline: (booking: SupplierBooking) => void;
  onStart: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  onMarkPaid: (bookingId: string) => void;
  actionLoading: boolean;
  reviewInput?: ReviewInput;
  reviewLoading: boolean;
  onReviewChange: (bookingId: string, values: ReviewInput) => void;
  onSubmitReview: (bookingId: string) => void;
  highlightReview?: boolean;
}) {
  const displayNotes = cleanNotesForDisplay(booking.notes);

  return (
    <div
      id={`booking-${booking.id}`}
      className={`space-y-4 rounded-xl border bg-white p-4 ${
        highlightReview ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"
      }`}
    >
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
            {formatBookingStatusLabel(booking.status)}
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

      {booking.serviceArea ? (
        <div className="text-sm text-gray-700">
          <span className="font-medium">Service area:</span> {booking.serviceArea}
        </div>
      ) : null}

      <DogDetails booking={booking} />
      <LocationSummary booking={booking} />

      {booking.accessInstructions ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <div className="font-medium">Access instructions</div>
          <div className="mt-1 whitespace-pre-line">{booking.accessInstructions}</div>
        </div>
      ) : null}

      {displayNotes ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <div className="font-medium text-gray-800">Notes</div>
          <div className="mt-1 whitespace-pre-line">{displayNotes}</div>
        </div>
      ) : null}

      <SupplierOwnerReview
        booking={booking}
        reviewInput={reviewInput}
        isSubmitting={reviewLoading}
        onChange={onReviewChange}
        onSubmit={onSubmitReview}
        highlight={highlightReview}
      />

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
          {actionLoading ? "Starting..." : "Start service"}
        </button>
      ) : null}

      {booking.status === "IN_PROGRESS" ? (
        <button
          type="button"
          onClick={() => onComplete(booking.id)}
          disabled={actionLoading}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {actionLoading ? "Completing..." : "Complete service"}
        </button>
      ) : null}

      {booking.status === "COMPLETED_UNBILLED" ? (
        <button
          type="button"
          onClick={() => onMarkPaid(booking.id)}
          disabled={actionLoading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {actionLoading ? "Saving..." : "Mark paid"}
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
  reviewInputs,
  activeReviewBookingId,
  onReviewChange,
  onSubmitReview,
  isOpen,
  onToggle,
  focusBookingId,
  focusAction,
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
  reviewInputs: Record<string, ReviewInput>;
  activeReviewBookingId: string | null;
  onReviewChange: (bookingId: string, values: ReviewInput) => void;
  onSubmitReview: (bookingId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  focusBookingId?: string | null;
  focusAction?: string | null;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-gray-200 bg-white p-5"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>

          <p className="mt-1 text-sm text-gray-500">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {bookings.length}
          </span>

          <span className="text-2xl text-gray-500">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="mt-5">
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
                  reviewInput={reviewInputs[booking.id]}
                  reviewLoading={activeReviewBookingId === booking.id}
                  onReviewChange={onReviewChange}
                  onSubmitReview={onSubmitReview}
                  highlightReview={
                    focusAction === "review" && focusBookingId === booking.id
                  }
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function SupplierBookingJourney({
  onViewBookings,
}: {
  onViewBookings: () => void;
}) {
  const steps = [
    {
      icon: "📩",
      title: "Receive request",
      text: "Owner sends booking, dog and timing details.",
    },
    {
      icon: "🐶",
      title: "Review Dog Passport",
      text: "Check health, behaviour and care notes.",
    },
    {
      icon: "✅",
      title: "Confirm booking",
      text: "Accept or suggest another time.",
    },
    {
      icon: "🚶",
      title: "Deliver service",
      text: "Start and complete the booking.",
    },
    {
      icon: "💳",
      title: "Mark paid",
      text: "Track payment and booking history.",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Your booking journey
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            From request to completed care, DogLife helps you manage each step.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewBookings}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          View booking requests
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="text-2xl">{step.icon}</div>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {index + 1}. {step.title}
            </p>
            <p className="mt-1 text-xs text-gray-500">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupplierDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const focusBookingId = searchParams.get("bookingId");
  const focusAction = searchParams.get("action");

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [activeReviewBookingId, setActiveReviewBookingId] = useState<string | null>(null);
  const [reviewInputs, setReviewInputs] = useState<Record<string, ReviewInput>>(
    {}
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    today: true,
    pending: false,
    confirmed: false,
    inProgress: false,
    completedUnbilled: false,
    completed: false,
    cancelled: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier-dashboard-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    },
  });

  const { data: completionData } = useQuery({
    queryKey: ["supplier-profile-completion"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile-completion");
      return res.data;
    },
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data;
    },
  });

  const notifications = Array.isArray(notificationsData?.notifications)
    ? notificationsData.notifications
    : [];

  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-dashboard-bookings"] });
  };

  const submitSupplierReviewMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const input = reviewInputs[bookingId];

      await api.post("/api/reviews", {
        bookingId,
        rating: Number(input.rating),
        comment: input.comment.trim() || null,
      });
    },
    onMutate: (bookingId) => setActiveReviewBookingId(bookingId),
    onSuccess: (_data, bookingId) => {
      refreshBookings();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setReviewInputs((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
    },
    onSettled: () => setActiveReviewBookingId(null),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/supplier/submit-for-review");
    },
    onSuccess: () => {
      alert("Profile submitted for DogLife review.");
      queryClient.invalidateQueries({
        queryKey: ["supplier-profile-completion"],
      });
    },
    onError: (err: any) => {
      alert(
        err?.response?.data?.error || "Failed to submit profile for review"
      );
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) =>
      api.patch(`/api/supplier/bookings/${bookingId}/accept`),
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const startMutation = useMutation({
    mutationFn: async (bookingId: string) =>
      api.patch(`/api/supplier/bookings/${bookingId}/start`),
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) =>
      api.patch(`/api/supplier/bookings/${bookingId}/complete`),
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (bookingId: string) =>
      api.patch(`/api/supplier/bookings/${bookingId}/mark-paid`),
    onMutate: (bookingId) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
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
        message,
      });
    },
    onMutate: ({ bookingId }) => setActiveBookingId(bookingId),
    onSuccess: refreshBookings,
    onSettled: () => setActiveBookingId(null),
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

  const rawBookings: SupplierBooking[] = data?.bookings || data?.data || data || [];
  const bookings = useMemo(
    () => (Array.isArray(rawBookings) ? rawBookings : []),
    [rawBookings]
  );

  const {
    todayBookings,
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedUnbilledBookings,
    completedBookings,
    cancelledBookings,
    totalActive,
    sectionMap,
  } = useMemo(() => {
    const today = sortBookingsByStart(
      bookings.filter((b) => isTodayBooking(b, todayStart, todayEnd))
    );

    const todayIds = new Set(today.map((b) => b.id));

    const pending = sortBookingsByStart(
      bookings.filter((b) => b.status === "PENDING" && !todayIds.has(b.id))
    );

    const confirmed = sortBookingsByStart(
      bookings.filter((b) => b.status === "CONFIRMED" && !todayIds.has(b.id))
    );

    const inProgress = sortBookingsByStart(
      bookings.filter((b) => b.status === "IN_PROGRESS" && !todayIds.has(b.id))
    );

    const completedUnbilled = sortBookingsByStart(
      bookings.filter(
        (b) => b.status === "COMPLETED_UNBILLED" && !todayIds.has(b.id)
      )
    );

    const completed = sortBookingsByStart(
      bookings.filter((b) => b.status === "COMPLETED" && !todayIds.has(b.id))
    );

    const cancelled = sortBookingsByStart(
      bookings.filter((b) => b.status === "CANCELLED" && !todayIds.has(b.id))
    );

    const active = bookings.filter((b) =>
      ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED_UNBILLED"].includes(
        b.status
      )
    ).length;

    return {
      todayBookings: today,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      inProgressBookings: inProgress,
      completedUnbilledBookings: completedUnbilled,
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalActive: active,
      sectionMap: [
        { key: "today", bookings: today },
        { key: "pending", bookings: pending },
        { key: "confirmed", bookings: confirmed },
        { key: "inProgress", bookings: inProgress },
        { key: "completedUnbilled", bookings: completedUnbilled },
        { key: "completed", bookings: completed },
        { key: "cancelled", bookings: cancelled },
      ],
    };
  }, [bookings, todayStart, todayEnd]);

  function handleReviewChange(bookingId: string, values: ReviewInput) {
    setReviewInputs((prev) => ({
      ...prev,
      [bookingId]: values,
    }));
  }

  function toggleSection(sectionKey: string) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }

  function openAndScroll(sectionKey: string, sectionId: string) {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));

    setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleNotificationClick(notification: any) {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    const bookingId = notification.referenceId || notification.booking?.id;
    if (!bookingId) return;

    const matchingSection = sectionMap.find((section) =>
      section.bookings.some((booking) => booking.id === bookingId)
    );

    if (matchingSection) {
      setOpenSections((prev) => ({
        ...prev,
        [matchingSection.key]: true,
      }));
    }

    const isReviewNotification = String(notification.title || "")
      .toLowerCase()
      .includes("review");

    setTimeout(() => {
      const targetId = isReviewNotification
        ? `review-${bookingId}`
        : `booking-${bookingId}`;

      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  useEffect(() => {
    if (!focusBookingId) return;

    const matchingSection = sectionMap.find((section) =>
      section.bookings.some((booking) => booking.id === focusBookingId)
    );

    if (!matchingSection) return;

    setOpenSections((prev) => ({
      ...prev,
      [matchingSection.key]: true,
    }));

    const timeoutId = window.setTimeout(() => {
      const targetId =
        focusAction === "review"
          ? `review-${focusBookingId}`
          : `booking-${focusBookingId}`;

      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      navigate("/supplier/dashboard", { replace: true });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [focusBookingId, focusAction, sectionMap, navigate]);

  function handleDecline(booking: SupplierBooking) {
    const message = window.prompt(
      "Add a message for the owner. You can suggest another time here.",
      ""
    );
    if (message === null) return;

    declineMutation.mutate({
      bookingId: booking.id,
      message: message.trim() || undefined,
    });
  }

  function renderSection(
    id: string,
    title: string,
    emptyText: string,
    sectionBookings: SupplierBooking[],
    sectionKey: string
  ) {
    return (
      <BookingSection
        id={id}
        title={title}
        emptyText={emptyText}
        bookings={sectionBookings}
        isLoading={isLoading}
        error={error}
        activeBookingId={activeBookingId}
        onAccept={(id) => acceptMutation.mutate(id)}
        onDecline={handleDecline}
        onStart={(id) => startMutation.mutate(id)}
        onComplete={(id) => completeMutation.mutate(id)}
        onMarkPaid={(id) => markPaidMutation.mutate(id)}
        isOpen={Boolean(openSections[sectionKey])}
        onToggle={() => toggleSection(sectionKey)}
        reviewInputs={reviewInputs}
        activeReviewBookingId={activeReviewBookingId}
        onReviewChange={handleReviewChange}
        onSubmitReview={(id) => submitSupplierReviewMutation.mutate(id)}
        focusBookingId={focusBookingId}
        focusAction={focusAction}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to DogLife 🐾
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Complete your supplier setup so dog owners can find and book you.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/supplier/business-profile"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit Business Profile
            </Link>

            <Link
              to="/supplier/availability"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Update Availability
            </Link>
          </div>
        </div>
      </div>

      <SupplierBookingJourney
        onViewBookings={() => openAndScroll("pending", "pending-bookings")}
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-medium text-gray-800">
          Profile completion: {completionData?.completionPercent ?? 0}%
        </p>

        <button
          type="button"
          onClick={() => submitForReviewMutation.mutate()}
          disabled={
            submitForReviewMutation.isPending ||
            completionData?.approvalStatus === "APPROVED" ||
            completionData?.completionPercent !== 100
          }
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completionData?.approvalStatus === "APPROVED"
            ? "Approved supplier ✓"
            : submitForReviewMutation.isPending
            ? "Submitting..."
            : "Submit for review"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <button
          type="button"
          onClick={() => openAndScroll("pending", "pending-bookings")}
          className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-gray-300 md:p-5"
        >
          <div className="text-xs text-gray-500 sm:text-sm">Pending</div>
          <div className="mt-2 text-2xl font-bold text-amber-600 sm:text-3xl">
            {pendingBookings.length}
          </div>
        </button>

        <button
          type="button"
          onClick={() => openAndScroll("confirmed", "confirmed-bookings")}
          className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-gray-300 md:p-5"
        >
          <div className="text-xs text-gray-500 sm:text-sm">Confirmed</div>
          <div className="mt-2 text-2xl font-bold text-green-600 sm:text-3xl">
            {confirmedBookings.length}
          </div>
        </button>

        <button
          type="button"
          onClick={() => openAndScroll("inProgress", "in-progress-bookings")}
          className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-gray-300 md:p-5"
        >
          <div className="text-xs text-gray-500 sm:text-sm">In Progress</div>
          <div className="mt-2 text-2xl font-bold text-blue-600 sm:text-3xl">
            {inProgressBookings.length}
          </div>
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="text-xs text-gray-500 sm:text-sm">
            Active Bookings
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {totalActive}
          </div>
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification: any) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`w-full rounded-lg border p-4 text-left ${
                notification.read
                  ? "border-gray-200 bg-gray-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <p className="font-semibold text-gray-800">{notification.title}</p>
              <p className="text-sm text-gray-600">
                {notification.booking
                  ? `${formatServiceName(notification.booking.serviceLabel)} with ${
                      firstNamesOnlyList(notification.booking.dogNames) ||
                      "the dog"
                    } on ${formatDateTime(notification.booking.startAt)}`
                  : notification.message}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-6">
        {renderSection(
          "today-bookings",
          "Today",
          "No bookings today.",
          todayBookings,
          "today"
        )}
        {renderSection(
          "pending-bookings",
          "Pending",
          "No pending bookings.",
          pendingBookings,
          "pending"
        )}
        {renderSection(
          "confirmed-bookings",
          "Confirmed",
          "No confirmed bookings.",
          confirmedBookings,
          "confirmed"
        )}
        {renderSection(
          "in-progress-bookings",
          "In Progress",
          "No bookings in progress.",
          inProgressBookings,
          "inProgress"
        )}
        {renderSection(
          "completed-unbilled-bookings",
          "Awaiting Payment",
          "No bookings awaiting payment.",
          completedUnbilledBookings,
          "completedUnbilled"
        )}
        {renderSection(
          "completed-bookings",
          "Completed",
          "No completed bookings.",
          completedBookings,
          "completed"
        )}
        {renderSection(
          "cancelled-bookings",
          "Cancelled",
          "No cancelled bookings.",
          cancelledBookings,
          "cancelled"
        )}
      </div>
    </div>
  );
}