export type BoardingSendSlotService = {
  id: string;
  service: string;
  bookingModel?: string | null;
  isActive?: boolean | null;
  maxDogsPerBooking?: number | null;
  concurrentCapacityDogs?: number | null;
};

export type SendSlotService = BoardingSendSlotService & {
  trainingBookingMode?: string | null;
};

export function getEffectiveSendSlotBookingModel(
  service: SendSlotService,
) {
  if (service.bookingModel) return service.bookingModel;

  if (
    service.service === "BOARDING" ||
    service.service === "PET_SITTING"
  ) {
    return "DATE_RANGE_CAPACITY";
  }

  if (service.service === "DAYCARE") {
    return "BLOCK_CAPACITY";
  }

  if (
    service.service === "TRAINING" &&
    service.trainingBookingMode === "SESSION_EVENT"
  ) {
    return "SESSION_EVENT";
  }

  return "APPOINTMENT";
}

export function isEligibleSendSlotService(service: SendSlotService) {
  if (service.isActive === false) return false;

  const bookingModel = getEffectiveSendSlotBookingModel(service);

  if (
    service.service === "WALKING" &&
    bookingModel === "APPOINTMENT"
  ) {
    return true;
  }

  if (
    service.service === "TRAINING" &&
    bookingModel === "APPOINTMENT"
  ) {
    return true;
  }

  if (
    service.service === "BOARDING" &&
    bookingModel === "DATE_RANGE_CAPACITY"
  ) {
    return isEligibleBoardingSendSlotService(service, bookingModel);
  }

  return false;
}

export function getSendSlotDogCountMaximum(
  service: SendSlotService,
): number | null {
  if (
    service.service === "BOARDING" &&
    getEffectiveSendSlotBookingModel(service) === "DATE_RANGE_CAPACITY"
  ) {
    return getBoardingDogCountCeiling(service);
  }

  const configuredMaximum =
    typeof service.maxDogsPerBooking === "number" &&
    service.maxDogsPerBooking > 0
      ? service.maxDogsPerBooking
      : null;

  if (
    service.service === "TRAINING" &&
    getEffectiveSendSlotBookingModel(service) === "APPOINTMENT"
  ) {
    return configuredMaximum;
  }

  const configuredLimits = [
    configuredMaximum,
    service.concurrentCapacityDogs,
  ].filter(
    (value): value is number =>
      typeof value === "number" && value > 0,
  );

  if (configuredLimits.length === 0) return 10;

  return Math.max(1, Math.min(...configuredLimits));
}

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
