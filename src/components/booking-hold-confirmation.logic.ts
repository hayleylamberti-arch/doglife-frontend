export type BoardingKennelType = "SOCIAL" | "PRIVATE";

export type BoardingHoldConversionPayload = {
  holdToken: string;
  dogIds: string[];
  kennelType: BoardingKennelType;
  healthSafetyAccepted: true;
  notes?: string;
};

const JOHANNESBURG_DATE_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
});

const JOHANNESBURG_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Africa/Johannesburg",
});

export function isBoardingHoldConfirmation(
  service?: string | null,
  bookingModel?: string | null
) {
  return (
    service === "BOARDING" &&
    bookingModel === "DATE_RANGE_CAPACITY"
  );
}

export function isBoardingKennelType(
  value: unknown
): value is BoardingKennelType {
  return value === "SOCIAL" || value === "PRIVATE";
}

function johannesburgDateParts(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid Boarding date");
  }

  const parts = JOHANNESBURG_DATE_PARTS_FORMATTER.formatToParts(date);
  const read = (type: "year" | "month" | "day") => {
    const part = parts.find((item) => item.type === type)?.value;
    if (!part) throw new Error("Invalid Boarding date");
    return Number(part);
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
}

export function formatBoardingHeldDate(value: string) {
  return JOHANNESBURG_DATE_FORMATTER.format(new Date(value));
}

export function getBoardingNightCount(
  startAt: string,
  endAt: string
) {
  const arrival = johannesburgDateParts(startAt);
  const departure = johannesburgDateParts(endAt);
  const arrivalUtc = Date.UTC(arrival.year, arrival.month - 1, arrival.day);
  const departureUtc = Date.UTC(
    departure.year,
    departure.month - 1,
    departure.day
  );
  const nights = (departureUtc - arrivalUtc) / 86_400_000;

  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("Departure date must be after arrival date");
  }

  return nights;
}

export function getHoldDogSelectionLimit({
  requestedDogCount,
  maxDogsPerBooking,
  concurrentCapacityDogs,
  isBoarding,
  isWalking,
  additionalDogEnabled,
}: {
  requestedDogCount: number;
  maxDogsPerBooking?: number | null;
  concurrentCapacityDogs?: number | null;
  isBoarding: boolean;
  isWalking: boolean;
  additionalDogEnabled?: boolean;
}) {
  const holdLimit = Math.max(1, requestedDogCount);
  const serviceLimit =
    typeof maxDogsPerBooking === "number" && maxDogsPerBooking > 0
      ? maxDogsPerBooking
      : holdLimit;
  const walkingLimit =
    isWalking && !additionalDogEnabled ? 1 : holdLimit;
  const boardingCapacityLimit =
    isBoarding &&
    typeof concurrentCapacityDogs === "number" &&
    concurrentCapacityDogs > 0
      ? concurrentCapacityDogs
      : holdLimit;

  return Math.min(
    holdLimit,
    serviceLimit,
    walkingLimit,
    boardingCapacityLimit
  );
}

export function getPrivateTrainingSessionPriceCents({
  service,
  bookingModel,
  baseRateCents,
  additionalDogEnabled,
  selectedDogCount,
}: {
  service?: string | null;
  bookingModel?: string | null;
  baseRateCents?: number | null;
  additionalDogEnabled?: boolean;
  selectedDogCount?: number;
}) {
  if (
    service !== "TRAINING" ||
    bookingModel !== "APPOINTMENT" ||
    additionalDogEnabled === true ||
    typeof baseRateCents !== "number" ||
    !Number.isFinite(baseRateCents) ||
    baseRateCents < 0 ||
    (selectedDogCount != null &&
      (!Number.isInteger(selectedDogCount) || selectedDogCount < 1))
  ) {
    return null;
  }

  return Math.round(baseRateCents);
}

export function calculateBoardingPriceEstimate({
  startAt,
  endAt,
  selectedDogCount,
  baseRateCents,
  additionalDogEnabled,
  additionalDogPriceCents,
  kennelType,
}: {
  startAt: string;
  endAt: string;
  selectedDogCount: number;
  baseRateCents: number;
  additionalDogEnabled: boolean;
  additionalDogPriceCents?: number | null;
  kennelType: BoardingKennelType;
}) {
  if (!Number.isInteger(selectedDogCount) || selectedDogCount < 1) {
    throw new Error("selectedDogCount must be a positive integer");
  }

  const nights = getBoardingNightCount(startAt, endAt);
  let totalCents = baseRateCents * nights;

  if (selectedDogCount > 1) {
    if (additionalDogEnabled) {
      totalCents +=
        (additionalDogPriceCents ?? 0) *
        (selectedDogCount - 1) *
        nights;
    } else {
      totalCents = baseRateCents * nights * selectedDogCount;
    }
  }

  if (kennelType === "PRIVATE") {
    totalCents += Math.round(totalCents * 0.15);
  }

  return { nights, totalCents };
}

export function buildBoardingHoldConversionPayload({
  holdToken,
  dogIds,
  kennelType,
  healthSafetyAccepted,
  notes,
}: {
  holdToken: string;
  dogIds: string[];
  kennelType: unknown;
  healthSafetyAccepted: boolean;
  notes?: string;
}): BoardingHoldConversionPayload {
  if (dogIds.length < 1) {
    throw new Error("Select at least one dog.");
  }

  if (!isBoardingKennelType(kennelType)) {
    throw new Error("Select a valid kennel preference.");
  }

  if (!healthSafetyAccepted) {
    throw new Error(
      "Please accept the Health & Safety Policy before booking."
    );
  }

  const trimmedNotes = notes?.trim();

  return {
    holdToken,
    dogIds: [...dogIds],
    kennelType,
    healthSafetyAccepted: true,
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
  };
}

export type HoldConversionErrorAction =
  | "NETWORK_RETRY"
  | "CORRECTABLE"
  | "TERMINAL_REFETCH";

export function classifyHoldConversionError(status?: number | null) {
  if (status == null) return "NETWORK_RETRY" as const;
  if (status === 404 || status === 409 || status === 410) {
    return "TERMINAL_REFETCH" as const;
  }
  return "CORRECTABLE" as const;
}
