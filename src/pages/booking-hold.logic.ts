const SERVICE_LABELS: Record<string, string> = {
  WALKING: "Dog walking",
  GROOMING: "Grooming",
  TRAINING: "Training",
  MOBILE_VET: "Mobile vet",
  PET_TRANSPORT: "Pet transport",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
});

export type PublicHoldSummaryRow = {
  label: string;
  value: string;
};

export function isBoardingDateRangeHold(
  service?: string | null,
  bookingModel?: string | null
) {
  return (
    service === "BOARDING" &&
    bookingModel === "DATE_RANGE_CAPACITY"
  );
}

export function getPublicHoldServiceLabel(
  service?: string | null,
  bookingModel?: string | null
) {
  if (!service) {
    return "Dog service";
  }

  if (isBoardingDateRangeHold(service, bookingModel)) {
    return "Boarding";
  }

  if (
    service === "PET_SITTING" &&
    bookingModel === "BLOCK_CAPACITY"
  ) {
    return "Pet Visit";
  }

  return (
    SERVICE_LABELS[service] ||
    service
      .toLowerCase()
      .split("_")
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(" ")
  );
}

export function formatJohannesburgDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

export function getBoardingPublicSummaryRows({
  startAt,
  endAt,
  requestedDogCount,
}: {
  startAt: string;
  endAt: string;
  requestedDogCount: number;
}): PublicHoldSummaryRow[] {
  return [
    {
      label: "Arrival",
      value: formatJohannesburgDate(startAt),
    },
    {
      label: "Departure",
      value: formatJohannesburgDate(endAt),
    },
    {
      label: "Dogs",
      value: `Up to ${requestedDogCount} ${
        requestedDogCount === 1 ? "dog" : "dogs"
      }`,
    },
  ];
}
