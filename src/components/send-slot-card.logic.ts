export type BoardingSendSlotService = {
  id: string;
  service: string;
  bookingModel?: string | null;
  isActive?: boolean | null;
  maxDogsPerBooking?: number | null;
  concurrentCapacityDogs?: number | null;
};

export function isEligibleBoardingSendSlotService(
  service: BoardingSendSlotService | null | undefined,
  effectiveBookingModel: string,
) {
  return (
    service?.service === "BOARDING" &&
    service.isActive === true &&
    effectiveBookingModel === "DATE_RANGE_CAPACITY" &&
    typeof service.concurrentCapacityDogs === "number" &&
    service.concurrentCapacityDogs > 0
  );
}

export function getBoardingDogCountCeiling(
  service: BoardingSendSlotService,
) {
  const capacity = service.concurrentCapacityDogs;

  if (typeof capacity !== "number" || capacity <= 0) {
    return 0;
  }

  const maximumPerBooking = service.maxDogsPerBooking;

  if (
    typeof maximumPerBooking !== "number" ||
    maximumPerBooking <= 0
  ) {
    return capacity;
  }

  return Math.min(maximumPerBooking, capacity);
}

export function getBoardingDateValidationError(
  arrivalDate: string,
  departureDate: string,
) {
  if (!arrivalDate || !departureDate) {
    return "Choose both an arrival date and a departure date.";
  }

  if (departureDate === arrivalDate) {
    return "Departure must be at least one day after arrival.";
  }

  if (departureDate < arrivalDate) {
    return "Departure must be after arrival.";
  }

  return null;
}

export function buildBoardingHoldCreatePayload(params: {
  supplierServiceId: string;
  arrivalDate: string;
  departureDate: string;
  requestedDogCount: number;
}) {
  return {
    supplierServiceId: params.supplierServiceId,
    arrivalDate: params.arrivalDate,
    departureDate: params.departureDate,
    requestedDogCount: params.requestedDogCount,
  };
}

export function getBoardingHoldCreateError(error: any) {
  const status = error?.response?.status;
  const backendMessage =
    error?.response?.data?.error || error?.response?.data?.message;
  const normalizedMessage = String(backendMessage || "").toLowerCase();

  if (!error?.response) {
    return "We couldn’t connect to DogLife. Check your connection and try again.";
  }

  if (status === 404) {
    return "This Boarding service is no longer available.";
  }

  if (status === 409) {
    if (
      normalizedMessage.includes("capacity") ||
      normalizedMessage.includes("only handle") ||
      normalizedMessage.includes("every night")
    ) {
      return "There isn’t enough Boarding capacity for the full selected stay.";
    }

    if (
      normalizedMessage.includes("blocked") ||
      normalizedMessage.includes("unavailable")
    ) {
      return "Boarding is unavailable for the full selected stay.";
    }

    return "Boarding availability changed while the link was being created. Please try again.";
  }

  if (status === 400 && backendMessage) {
    return String(backendMessage);
  }

  return "The Boarding booking link could not be created.";
}
