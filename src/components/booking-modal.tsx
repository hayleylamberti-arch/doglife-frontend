import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

interface Props {
  supplierId: string;
  supplierName?: string | null;
  service: any;
  selectedServiceSession?: any | null;
  onClose: () => void;
}

type KennelType = "SOCIAL" | "PRIVATE";
type PetSittingLocation = "OWNER_HOME" | "SITTER_HOME";
type PetTransportJourneyType = "ONE_WAY" | "RETURN";
type DaycareSessionType = "HALF_DAY" | "FULL_DAY";
type HalfDayPeriod = "MORNING" | "AFTERNOON";
type BookingModel =
  | "APPOINTMENT"
  | "DATE_RANGE_CAPACITY"
  | "BLOCK_CAPACITY"
  | "SESSION_EVENT";

type BookingBlock = {
  key: string;
  label: string;
  startTime: string;
  endTime: string;
  priceCents: number;
};

interface Dog {
  id: string;
  name: string;
  breed?: string | null;
  size?: string | null;
}

type GroomingSelection = {
  category: string;
  size: string;
};

type BookingSlotOption = {
  id?: string;
  startTime: string;
  endTime?: string;
};

function formatServiceName(value?: string) {
  return String(value || "SERVICE").replace(/_/g, " ");
}

function getEffectiveBookingModel(service: any): BookingModel {
  if (service?.bookingModel) {
    return service.bookingModel as BookingModel;
  }

  switch (service?.service) {
    case "BOARDING":
    case "PET_SITTING":
      return "DATE_RANGE_CAPACITY";

    case "DAYCARE":
      return "BLOCK_CAPACITY";

    default:
      return "APPOINTMENT";
  }
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function formatLabel(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getHttpStatus(error: unknown) {
  return (error as any)?.response?.status || null;
}

type BoardingHandoverWindow = {
  startTime: string;
  endTime: string;
};

function getBoardingWindowsForDate(
  date: string,
  weeklyWindows: unknown
): BoardingHandoverWindow[] {
  if (!date || !weeklyWindows || typeof weeklyWindows !== "object") {
    return [];
  }

  const parsedDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return [];
  }

  const dayKey = String(parsedDate.getDay());
  const value = (weeklyWindows as Record<string, unknown>)[dayKey];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item: any) =>
        item &&
        typeof item.startTime === "string" &&
        typeof item.endTime === "string"
    )
    .map((item: any) => ({
      startTime: item.startTime,
      endTime: item.endTime,
    }));
}

function formatBoardingWindow(window: BoardingHandoverWindow) {
  return `${window.startTime}–${window.endTime}`;
}

function getStayDays(arrivalDate: string, departureDate: string) {
  if (!arrivalDate || !departureDate) return 1;

  const start = new Date(`${arrivalDate}T09:00:00`);
  const end = new Date(`${departureDate}T09:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  if (end <= start) return 1;

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / msPerDay)
  );
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function normalizeSlot(slot: any): BookingSlotOption | null {
  if (typeof slot === "string") {
    return { startTime: slot };
  }

  if (slot?.startTime) {
    return {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  }

  return null;
}

function flattenBookableSlots(payload: any): BookingSlotOption[] {
  const groupedSlots = payload?.slots || {};

  return [
    ...(groupedSlots.morning || []),
    ...(groupedSlots.afternoon || []),
    ...(groupedSlots.evening || []),
  ]
    .map((slot) => normalizeSlot(slot?.start || slot?.startTime || slot))
    .filter(Boolean) as BookingSlotOption[];
}

function resolveLegacyDaycareBlock(
  service: any,
  daycareSessionType: DaycareSessionType,
  halfDayPeriod: HalfDayPeriod
): BookingBlock | null {
  if (service?.service !== "DAYCARE") return null;

  if (daycareSessionType === "FULL_DAY") {
    return {
      key: "FULL_DAY",
      label: "Full day",
      startTime: "09:00",
      endTime: "17:00",
      priceCents:
        toNumber(service?.pricingJson?.fullDayPriceCents) ||
        toNumber(service?.baseRateCents),
    };
  }

  if (halfDayPeriod === "AFTERNOON") {
    return {
      key: "AFTERNOON_HALF_DAY",
      label: "Afternoon half day",
      startTime: "13:00",
      endTime: "17:00",
      priceCents: toNumber(service?.pricingJson?.halfDayPriceCents),
    };
  }

  return {
    key: "MORNING_HALF_DAY",
    label: "Morning half day",
    startTime: "09:00",
    endTime: "13:00",
    priceCents: toNumber(service?.pricingJson?.halfDayPriceCents),
  };
}

function buildBookingBlockTimes(date: string, block: BookingBlock) {
  if (!date) {
    return {
      startAt: null as Date | null,
      endAt: null as Date | null,
    };
  }

  return {
    startAt: new Date(`${date}T${block.startTime}:00`),
    endAt: new Date(`${date}T${block.endTime}:00`),
  };
}

function firstNameOnly(value?: string | null) {
  if (!value) return "";
  return String(value).trim().split(/\s+/)[0] || "";
}

function formatBookingDateTime(value?: string | Date | null) {
  if (!value) return "";

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function BookingModal({
  supplierId,
  supplierName,
  service,
  selectedServiceSession,
  onClose,
}: Props) {
  const serviceType = service?.service || "WALKING";

  const isBoarding = serviceType === "BOARDING";
  const isPetSitting = serviceType === "PET_SITTING";
  const isMobileVet = serviceType === "MOBILE_VET";
  const isPetTransport = serviceType === "PET_TRANSPORT";
  const isGrooming = serviceType === "GROOMING";
  const isWalking = serviceType === "WALKING";
  const isTraining = serviceType === "TRAINING";
  const isDaycare = serviceType === "DAYCARE";

  const bookingModel = getEffectiveBookingModel(service);

  const isSessionEventService =
  bookingModel === "SESSION_EVENT";

  const isStayService =
    bookingModel === "DATE_RANGE_CAPACITY";

  const isBlockCapacityService =
    bookingModel === "BLOCK_CAPACITY";

  const usesTimeSlots =
    bookingModel === "APPOINTMENT";

  const appointmentDurationMinutes = Number(
    service?.durationMinutes || 60
  );

  const [ownerAddress, setOwnerAddress] = useState("");

  const [date, setDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [selectedBoardingDropoffIndex, setSelectedBoardingDropoffIndex] =
    useState<number | null>(null);

  const [selectedBoardingCollectionIndex, setSelectedBoardingCollectionIndex] =
    useState<number | null>(null);

  const [slots, setSlots] = useState<BookingSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [returnDate, setReturnDate] = useState("");
  const [returnSlots, setReturnSlots] = useState<BookingSlotOption[]>([]);
  const [selectedReturnSlot, setSelectedReturnSlot] = useState<string | null>(
    null
  );

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [dogsLoading, setDogsLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const [notes, setNotes] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [acceptedHealthSafety, setAcceptedHealthSafety] = useState(false);
  const [loading, setLoading] = useState(false);

  const [kennelType, setKennelType] = useState<KennelType>("SOCIAL");

  const [petSittingLocation, setPetSittingLocation] =
    useState<PetSittingLocation>("OWNER_HOME");

  const [journeyType, setJourneyType] =
    useState<PetTransportJourneyType>("ONE_WAY");

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const [daycareSessionType, setDaycareSessionType] =
    useState<DaycareSessionType>("FULL_DAY");

  const [halfDayPeriod, setHalfDayPeriod] =
    useState<HalfDayPeriod>("MORNING");

  const [selectedBookingBlockId, setSelectedBookingBlockId] =
    useState<string | null>(null);

  const bookingBlocks: any[] =
    isBlockCapacityService &&
    Array.isArray(service?.bookingBlocks)
      ? service.bookingBlocks
      : [];

  const selectedBookingBlock =
  bookingBlocks.find(
    (block) => block.id === selectedBookingBlockId
  ) || null;

  const groomingTiers: any[] = Array.isArray(service?.pricingTiers)
    ? service.pricingTiers
    : [];

  const groomingCategories = Array.from(
    new Set(groomingTiers.map((tier) => tier.category).filter(Boolean))
  );

  const [groomingSelections, setGroomingSelections] = useState<
    Record<string, GroomingSelection>
  >({});

  const [isMobileGrooming, setIsMobileGrooming] = useState(false);

  const getGroomingTier = (category: string, size: string) =>
    groomingTiers.find(
      (tier) => tier.category === category && tier.dogSize === size
    ) || null;

  const mobileVetServices: any[] = Array.isArray(
    service?.pricingJson?.mobileVetServices
  )
    ? service.pricingJson.mobileVetServices
    : [];

  const mobileOptions = mobileVetServices.length
    ? mobileVetServices
    : [
        {
          key: "CHECK_UP",
          label: "Check-up / consultation",
          priceCents: service?.baseRateCents || 0,
        },
      ];

  const [mobileVetService, setMobileVetService] = useState(
    mobileOptions[0]?.key || "CHECK_UP"
  );

  const shouldRequireOwnerAddress =
  isWalking ||
  (isTraining && !isSessionEventService) ||
  isMobileVet ||
  isMobileGrooming ||
  (isPetSitting && petSittingLocation === "OWNER_HOME");

  const shouldShowAccessInstructions =
    shouldRequireOwnerAddress || isPetTransport;

  const stayDays = useMemo(
    () => getStayDays(arrivalDate, departureDate),
    [arrivalDate, departureDate]
  );

  const boardingDropoffWindows = useMemo(
    () =>
      isBoarding
        ? getBoardingWindowsForDate(
            arrivalDate,
            service?.pricingJson?.boardingDropoffWindows
          )
        : [],
    [
      isBoarding,
      arrivalDate,
      service?.pricingJson?.boardingDropoffWindows,
    ]
  );

  const boardingCollectionWindows = useMemo(
    () =>
      isBoarding
        ? getBoardingWindowsForDate(
            departureDate,
            service?.pricingJson?.boardingCollectionWindows
          )
        : [],
    [
      isBoarding,
      departureDate,
      service?.pricingJson?.boardingCollectionWindows,
    ]
  );

  const selectedBoardingDropoffWindow =
    selectedBoardingDropoffIndex != null
      ? boardingDropoffWindows[selectedBoardingDropoffIndex] || null
      : null;

  const selectedBoardingCollectionWindow =
    selectedBoardingCollectionIndex != null
      ? boardingCollectionWindows[selectedBoardingCollectionIndex] || null
      : null;

  const maxDogsPerBooking = useMemo(() => {
    return toNumber(service?.maxDogsPerBooking);
  }, [service?.maxDogsPerBooking]);

  const walkingAdditionalDogEnabled = useMemo(
    () => isWalking && toBoolean(service?.additionalDogEnabled),
    [isWalking, service?.additionalDogEnabled]
  );

  const walkingAdditionalDogPriceCents = useMemo(
    () => toNumber(service?.additionalDogPriceCents),
    [service?.additionalDogPriceCents]
  );

  const estimatedWalkingTotalCents = useMemo(() => {
    if (!isWalking) return null;

    const dogCount = Math.max(1, selectedDogIds.length || 1);

    return (
      toNumber(service?.baseRateCents) +
      walkingAdditionalDogPriceCents * Math.max(0, dogCount - 1)
    );
  }, [
    isWalking,
    selectedDogIds.length,
    service?.baseRateCents,
    walkingAdditionalDogPriceCents,
  ]);

  const boardingBaseRateCents = useMemo(() => {
    return toNumber(service?.baseRateCents);
  }, [service?.baseRateCents]);

  const boardingAdditionalDogEnabled = useMemo(() => {
    const directEnabled = toBoolean(service?.additionalDogEnabled);

    const pricingJsonEnabled = toBoolean(
      service?.pricingJson?.additionalDogEnabled
    );

    const additionalDogPriceExists =
      toNumber(service?.additionalDogPriceCents) > 0 ||
      toNumber(service?.pricingJson?.additionalDogPriceCents) > 0 ||
      toNumber(service?.pricingJson?.additionalDogPrice) > 0;

    return directEnabled || pricingJsonEnabled || additionalDogPriceExists;
  }, [
    service?.additionalDogEnabled,
    service?.pricingJson?.additionalDogEnabled,
    service?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPrice,
  ]);

  const boardingAdditionalDogPriceCents = useMemo(() => {
    return (
      toNumber(service?.additionalDogPriceCents) ||
      toNumber(service?.pricingJson?.additionalDogPriceCents) ||
      toNumber(service?.pricingJson?.additionalDogPrice)
    );
  }, [
    service?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPrice,
  ]);

  const estimatedBoardingTotalCents = useMemo(() => {
    if (!isBoarding) return null;

    const dogCount = Math.max(1, selectedDogIds.length || 1);
    let total = boardingBaseRateCents * stayDays;

    if (dogCount > 1) {
      if (
        boardingAdditionalDogEnabled &&
        boardingAdditionalDogPriceCents > 0
      ) {
        total +=
          boardingAdditionalDogPriceCents * (dogCount - 1) * stayDays;
      } else {
        total = boardingBaseRateCents * dogCount * stayDays;
      }
    }

    if (kennelType === "PRIVATE") {
      total += Math.round(total * 0.15);
    }

    return total;
  }, [
    isBoarding,
    selectedDogIds.length,
    boardingBaseRateCents,
    boardingAdditionalDogEnabled,
    boardingAdditionalDogPriceCents,
    stayDays,
    kennelType,
  ]);

  const estimatedPetSittingTotalCents = useMemo(() => {
    if (!isPetSitting) return null;

    const dogCount = Math.max(1, selectedDogIds.length || 1);
    let total = boardingBaseRateCents * stayDays;

    if (dogCount > 1) {
      if (
        boardingAdditionalDogEnabled &&
        boardingAdditionalDogPriceCents > 0
      ) {
        total +=
          boardingAdditionalDogPriceCents * (dogCount - 1) * stayDays;
      } else {
        total = boardingBaseRateCents * dogCount * stayDays;
      }
    }

    return total;
  }, [
    isPetSitting,
    selectedDogIds.length,
    boardingBaseRateCents,
    boardingAdditionalDogEnabled,
    boardingAdditionalDogPriceCents,
    stayDays,
  ]);

  const daycareHalfDayPriceCents = useMemo(() => {
    return toNumber(service?.pricingJson?.halfDayPriceCents);
  }, [service?.pricingJson?.halfDayPriceCents]);

  const daycareFullDayPriceCents = useMemo(() => {
    return (
      toNumber(service?.pricingJson?.fullDayPriceCents) ||
      toNumber(service?.baseRateCents)
    );
  }, [service?.pricingJson?.fullDayPriceCents, service?.baseRateCents]);

  const daycareAdditionalDogEnabled = useMemo(() => {
    const directEnabled = toBoolean(service?.additionalDogEnabled);

    const pricingJsonEnabled = toBoolean(
      service?.pricingJson?.additionalDogEnabled
    );

    const additionalDogPriceExists =
      toNumber(service?.additionalDogPriceCents) > 0 ||
      toNumber(service?.pricingJson?.additionalDogPriceCents) > 0 ||
      toNumber(service?.pricingJson?.additionalDogPrice) > 0;

    return directEnabled || pricingJsonEnabled || additionalDogPriceExists;
  }, [
    service?.additionalDogEnabled,
    service?.pricingJson?.additionalDogEnabled,
    service?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPrice,
  ]);

  const daycareAdditionalDogPriceCents = useMemo(() => {
    return (
      toNumber(service?.additionalDogPriceCents) ||
      toNumber(service?.pricingJson?.additionalDogPriceCents) ||
      toNumber(service?.pricingJson?.additionalDogPrice)
    );
  }, [
    service?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPriceCents,
    service?.pricingJson?.additionalDogPrice,
  ]);

  const daycareBaseSessionPriceCents = useMemo(() => {
    return daycareSessionType === "HALF_DAY"
      ? daycareHalfDayPriceCents
      : daycareFullDayPriceCents;
  }, [
    daycareSessionType,
    daycareHalfDayPriceCents,
    daycareFullDayPriceCents,
  ]);

  const estimatedDaycareTotalCents = useMemo(() => {
    if (!isDaycare) return null;

    const dogCount = Math.max(1, selectedDogIds.length || 1);
    let total = daycareBaseSessionPriceCents;

    if (dogCount > 1) {
      if (
        daycareAdditionalDogEnabled &&
        daycareAdditionalDogPriceCents > 0
      ) {
        total += daycareAdditionalDogPriceCents * (dogCount - 1);
      } else {
        total = daycareBaseSessionPriceCents * dogCount;
      }
    }

    return total;
  }, [
    isDaycare,
    selectedDogIds.length,
    daycareBaseSessionPriceCents,
    daycareAdditionalDogEnabled,
    daycareAdditionalDogPriceCents,
  ]);

  const petTransportOneWayPriceCents = useMemo(() => {
    return (
      toNumber(service?.pricingJson?.oneWayPriceCents) ||
      toNumber(service?.pricingJson?.singleTripPriceCents) ||
      toNumber(service?.baseRateCents)
    );
  }, [
    service?.pricingJson?.oneWayPriceCents,
    service?.pricingJson?.singleTripPriceCents,
    service?.baseRateCents,
  ]);

  const petTransportReturnPriceCents = useMemo(() => {
  return petTransportOneWayPriceCents * 2;
  }, [petTransportOneWayPriceCents]);

  const estimatedPetTransportTotalCents = useMemo(() => {
    if (!isPetTransport) return null;

    return journeyType === "RETURN"
      ? petTransportReturnPriceCents
      : petTransportOneWayPriceCents;
  }, [
    isPetTransport,
    journeyType,
    petTransportReturnPriceCents,
    petTransportOneWayPriceCents,
  ]);

  const displayPrice = useMemo(() => {
  if (isSessionEventService) {
    return Number(selectedServiceSession?.priceCents || 0);
  }

  if (isBlockCapacityService && selectedBookingBlock) {
    return toNumber(selectedBookingBlock.priceCents);
  }

  if (isBoarding) {
      return estimatedBoardingTotalCents ?? boardingBaseRateCents;
    }

    if (isPetSitting) {
      return estimatedPetSittingTotalCents ?? boardingBaseRateCents;
    }

    if (isDaycare) {
      return estimatedDaycareTotalCents ?? daycareBaseSessionPriceCents;
    }

    if (isWalking) {
      return estimatedWalkingTotalCents ?? toNumber(service?.baseRateCents);
    }

    if (isPetTransport) {
      return (
        estimatedPetTransportTotalCents ?? petTransportOneWayPriceCents
      );
    }

    if (isGrooming) {
      return selectedDogIds.reduce((sum, dogId) => {
        const selection = groomingSelections[dogId];

        if (!selection) return sum;

        const tier = getGroomingTier(
          selection.category,
          selection.size
        );

        return sum + toNumber(tier?.priceCents);
      }, 0);
    }

    if (isMobileVet) {
      const selectedMobileVetService = mobileOptions.find(
        (option) => option.key === mobileVetService
      );

      const pricePerDog =
        toNumber(selectedMobileVetService?.priceCents) ||
        toNumber(service?.baseRateCents);

      const dogCount = Math.max(1, selectedDogIds.length || 1);

      return pricePerDog * dogCount;
    }

    return service?.baseRateCents;
  }, [
    isBoarding,
    estimatedBoardingTotalCents,
    boardingBaseRateCents,
    isBlockCapacityService,
    selectedBookingBlock?.priceCents,
    isPetSitting,
    estimatedPetSittingTotalCents,
    isDaycare,
    estimatedDaycareTotalCents,
    daycareBaseSessionPriceCents,
    isWalking,
    estimatedWalkingTotalCents,
    isPetTransport,
    estimatedPetTransportTotalCents,
    petTransportOneWayPriceCents,
    isGrooming,
    groomingSelections,
    selectedDogIds,
    isMobileVet,
    mobileVetService,
    mobileOptions,
    isSessionEventService,
    selectedServiceSession?.priceCents,
    service?.baseRateCents,
  ]);

  const displaySubtitle = useMemo(() => {
  if (isSessionEventService) {
    return `${formatPrice(
      selectedServiceSession?.priceCents
    )} per dog`;
  }

  if (isBlockCapacityService && selectedBookingBlock) {
    return `${formatPrice(
      selectedBookingBlock.priceCents
    )} • ${selectedBookingBlock.label}`;
  }

  if (isBoarding) {
      if (arrivalDate && departureDate) {
        const dogCount = Math.max(1, selectedDogIds.length || 1);

        return `${formatPrice(displayPrice)} total • ${stayDays} night${
          stayDays > 1 ? "s" : ""
        } • ${dogCount} dog${dogCount > 1 ? "s" : ""}`;
      }

      return `${formatPrice(boardingBaseRateCents)} per night`;
    }

    if (isPetSitting) {
      if (arrivalDate && departureDate) {
        const dogCount = Math.max(1, selectedDogIds.length || 1);

        return `${formatPrice(displayPrice)} total • ${stayDays} night${
          stayDays > 1 ? "s" : ""
        } • ${dogCount} dog${dogCount > 1 ? "s" : ""}`;
      }

      return `${formatPrice(boardingBaseRateCents)} per night`;
    }

    if (isDaycare) {
      const dogCount = Math.max(1, selectedDogIds.length || 1);

      const sessionLabel =
        daycareSessionType === "HALF_DAY"
          ? `half day • ${halfDayPeriod.toLowerCase()}`
          : "full day";

      return `${formatPrice(
        displayPrice
      )} total • ${sessionLabel} • ${dogCount} dog${
        dogCount > 1 ? "s" : ""
      }`;
    }

    if (isWalking) {
      const dogCount = Math.max(1, selectedDogIds.length || 1);

      return `${formatPrice(displayPrice)} total • ${dogCount} dog${
        dogCount > 1 ? "s" : ""
      }`;
    }

    if (isPetTransport) {
      const journeyLabel =
        journeyType === "RETURN" ? "return journey" : "one way";

      return `${formatPrice(displayPrice)} total • ${journeyLabel}`;
    }

    if (isGrooming) {
      const dogCount = Math.max(1, selectedDogIds.length || 1);

      return `${formatPrice(displayPrice)} total • ${dogCount} dog${
        dogCount > 1 ? "s" : ""
      }`;
    }

    return `${formatPrice(displayPrice)} ${
      service?.unit
        ? `per ${String(service.unit).toLowerCase().replace(/^per_/, "")}`
        : ""
    }`;
  }, [
    isBoarding,
    isPetSitting,
    isDaycare,
    isWalking,
    isPetTransport,
    isGrooming,
    arrivalDate,
    departureDate,
    selectedDogIds.length,
    stayDays,
    displayPrice,
    boardingBaseRateCents,
    daycareSessionType,
    halfDayPeriod,
    journeyType,
    service?.unit,
    isSessionEventService,
    selectedServiceSession?.priceCents,
    isBlockCapacityService,
    selectedBookingBlock?.priceCents,
    selectedBookingBlock?.label,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerData() {
      setDogsLoading(true);
      setAuthRequired(false);

      const [profileRes, dogsRes] = await Promise.allSettled([
        api.get("/api/owner/profile"),
        api.get("/api/owner/dogs"),
      ]);

      if (cancelled) return;

      const profileStatus =
        profileRes.status === "rejected"
          ? getHttpStatus(profileRes.reason)
          : null;

      const dogsStatus =
        dogsRes.status === "rejected"
          ? getHttpStatus(dogsRes.reason)
          : null;

      if (profileStatus === 401 || dogsStatus === 401) {
        setAuthRequired(true);
        setDogs([]);
        setDogsLoading(false);
        return;
      }

      if (profileRes.status === "fulfilled") {
        const profile = profileRes.value.data?.profile;
        const address = profile?.address || "";

        setOwnerAddress(address);

        if (isPetTransport && address) {
          setPickup(address);
        }

        if (Array.isArray(profile?.dogs)) {
          setDogs(profile.dogs);
        }
      }

      if (dogsRes.status === "fulfilled") {
        const dogsPayload =
          dogsRes.value.data?.dogs ||
          dogsRes.value.data?.data ||
          dogsRes.value.data?.profile?.dogs ||
          [];

        if (Array.isArray(dogsPayload)) {
          setDogs(dogsPayload);
        }
      }

      setDogsLoading(false);
    }

    loadOwnerData();

    return () => {
      cancelled = true;
    };
  }, [isPetTransport]);

  useEffect(() => {
    if (!usesTimeSlots || !date) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    api
      .get(
        `/api/suppliers/${supplierId}/services/${
          service.id
        }/bookable-slots?date=${date}&dogCount=${Math.max(
          1,
          selectedDogIds.length || 1
        )}&limit=50`
      )
      .then((res) => {
        setSlots(flattenBookableSlots(res.data));
        setSelectedSlot(null);
      })
      .catch(() => {
        setSlots([]);
        setSelectedSlot(null);
      });
  }, [
    date,
    supplierId,
    service.id,
    usesTimeSlots,
    selectedDogIds.length,
  ]);

  useEffect(() => {
    if (
      !isPetTransport ||
      journeyType !== "RETURN" ||
      !returnDate
    ) {
      setReturnSlots([]);
      setSelectedReturnSlot(null);
      return;
    }

    api
      .get(
        `/api/suppliers/${supplierId}/services/${
          service.id
        }/bookable-slots?date=${returnDate}&dogCount=${Math.max(
          1,
          selectedDogIds.length || 1
        )}&limit=50`
      )
      .then((res) => {
        setReturnSlots(flattenBookableSlots(res.data));
        setSelectedReturnSlot(null);
      })
      .catch(() => {
        setReturnSlots([]);
        setSelectedReturnSlot(null);
      });
  }, [
    isPetTransport,
    journeyType,
    returnDate,
    supplierId,
    service.id,
    selectedDogIds.length,
  ]);

  useEffect(() => {
    if (journeyType === "ONE_WAY") {
      setReturnDate("");
      setReturnSlots([]);
      setSelectedReturnSlot(null);
    }
  }, [journeyType]);

  useEffect(() => {
    if (!date || !returnDate) return;

    if (returnDate < date) {
      setReturnDate(date);
      setSelectedReturnSlot(null);
    }
  }, [date, returnDate]);

  useEffect(() => {
    if (!isGrooming || groomingCategories.length === 0) return;

    setGroomingSelections((prev) => {
      const next: Record<string, GroomingSelection> = {};

      selectedDogIds.forEach((dogId) => {
        const dog = dogs.find((item) => item.id === dogId);
        const existing = prev[dogId];

        const category =
          existing?.category || String(groomingCategories[0]);

        const tiersForCategory = groomingTiers.filter(
          (tier) => tier.category === category
        );

        const size =
          existing?.size ||
          dog?.size ||
          tiersForCategory[0]?.dogSize ||
          "";

        next[dogId] = {
          category,
          size,
        };
      });

      return next;
    });
  }, [
    isGrooming,
    selectedDogIds,
    dogs,
    groomingCategories,
    groomingTiers,
  ]);

  function toggleDog(id: string) {
    setSelectedDogIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((dogId) => dogId !== id);
      }

      if (isWalking && !walkingAdditionalDogEnabled) {
        return [id];
      }

      if (maxDogsPerBooking > 0 && prev.length >= maxDogsPerBooking) {
        alert(`You can only book up to ${maxDogsPerBooking} dog(s) for this service`);
        return prev;
      }

      return [...prev, id];
    });
  }

  function buildNotes(params?: {
    returnStartAt?: Date | null;
    returnEndAt?: Date | null;
  }) {
    const parts: string[] = [];

    if (shouldRequireOwnerAddress && ownerAddress) {
      if (isTraining) {
        parts.push("Training location: owner home.");
      } else {
        parts.push("Service location: OWNER_HOME.");
      }

      parts.push(`Owner address: ${ownerAddress}.`);
    }

    if (isBoarding) {
      parts.push(`Kennel preference: ${formatLabel(kennelType)} kennel.`);
    }

    if (isPetSitting) {
      parts.push(`Pet sitting location: ${petSittingLocation}.`);
    }

    if (isPetTransport) {
      parts.push(`Journey type: ${formatLabel(journeyType)}.`);

      parts.push(`Pickup point: ${pickup.trim()}.`);
      parts.push(`Drop-off point: ${dropoff.trim()}.`);

      if (
        journeyType === "RETURN" &&
        params?.returnStartAt &&
        params?.returnEndAt
      ) {
        parts.push(`Return pickup point: ${dropoff.trim()}.`);
        parts.push(`Return drop-off point: ${pickup.trim()}.`);

        parts.push(
          `Return date and time: ${formatBookingDateTime(
            params.returnStartAt
          )} - ${formatBookingDateTime(params.returnEndAt)}.`
        );
      }
    }

    if (isMobileVet) {
      parts.push(`Mobile vet service: ${mobileVetService}.`);
    }

    if (isGrooming) {
      const groomingLines = selectedDogIds
        .map((dogId) => {
          const dog = dogs.find((item) => item.id === dogId);
          const selection = groomingSelections[dogId];

          if (!selection) return null;

          return `${firstNameOnly(
            dog?.name || dogId
          )} - ${formatLabel(selection.category)}, ${formatLabel(
            selection.size
          )}.`;
        })
        .filter(Boolean) as string[];

      if (groomingLines.length > 0) {
        parts.push(
          `Grooming selections:\n${groomingLines.join("\n")}`
        );
      }

      if (isMobileGrooming) {
        parts.push("Mobile grooming.");
      }
    }

    if (isDaycare) {
      parts.push(`Daycare type: ${daycareSessionType}.`);

      if (daycareSessionType === "HALF_DAY") {
        parts.push(`Half day period: ${halfDayPeriod}.`);
      }
    }

    if (notes.trim()) {
      parts.push(notes.trim());
    }

    return parts.join("\n");
  }

  async function handleBooking() {
    if (authRequired) {
      return alert("Please log in as an owner to book.");
    }

    if (selectedDogIds.length === 0) {
      return alert("Select at least one dog");
    }

    if (
      isWalking &&
      !walkingAdditionalDogEnabled &&
      selectedDogIds.length > 1
    ) {
      return alert("This walking service allows one dog per booking");
    }

    const resolvedBlock = isBlockCapacityService
  ? selectedBookingBlock ||
    resolveLegacyDaycareBlock(
      service,
      daycareSessionType,
      halfDayPeriod
    )
  : null;

if (isBlockCapacityService && !resolvedBlock) {
  return alert(
    "Please select a booking option."
  );
}

    if (
      maxDogsPerBooking > 0 &&
      selectedDogIds.length > maxDogsPerBooking
    ) {
      return alert(
        `You can only book up to ${maxDogsPerBooking} dog(s) for this service`
      );
    }

    if (
      isStayService &&
      (!arrivalDate || !departureDate)
    ) {
      return alert("Select arrival and departure dates");
    }

    if (
      isBoarding &&
      boardingDropoffWindows.length > 0 &&
      !selectedBoardingDropoffWindow
    ) {
      return alert("Select a drop-off window");
    }

    if (
      isBoarding &&
      boardingCollectionWindows.length > 0 &&
      !selectedBoardingCollectionWindow
    ) {
      return alert("Select a collection window");
    }

    if (isBlockCapacityService && !date) {
      return alert(
        isDaycare
          ? "Select a daycare date"
          : "Select a booking date"
      );
    }

    if (
      !isSessionEventService &&
      !isStayService &&
      !isBlockCapacityService &&
      !date
    ) {
      return alert("Select a date");
    }

    if (
      isSessionEventService &&
      !selectedServiceSession?.id
    ) {
      return alert("Please select a class or course session");
    }

    if (usesTimeSlots && slots.length === 0) {
      return alert("No available time slots for this date");
    }

    if (usesTimeSlots && !selectedSlot) {
      return alert("Select a time");
    }

    if (shouldRequireOwnerAddress && !ownerAddress) {
      return alert(
        "Please add your home address in your profile first"
      );
    }

    if (
      isPetTransport &&
      (!pickup.trim() || !dropoff.trim())
    ) {
      return alert("Enter pickup and drop-off points");
    }

    if (
      isPetTransport &&
      journeyType === "RETURN" &&
      !returnDate
    ) {
      return alert("Select a return date");
    }

    if (
      isPetTransport &&
      journeyType === "RETURN" &&
      returnSlots.length === 0
    ) {
      return alert(
        "No available return time slots for the selected date"
      );
    }

    if (
      isPetTransport &&
      journeyType === "RETURN" &&
      !selectedReturnSlot
    ) {
      return alert("Select a return time");
    }

    if (isGrooming) {
      const missingSelection = selectedDogIds.some(
        (dogId) =>
          !groomingSelections[dogId]?.category ||
          !groomingSelections[dogId]?.size
      );

      if (missingSelection) {
        return alert(
          "Select grooming option and size for each dog"
        );
      }
    }

    if (!acceptedHealthSafety) {
      return alert(
        "Please confirm the Health & Safety Policy before requesting a booking."
      );
    }

    setLoading(true);

    try {
      let startAt: Date;
      let endAt: Date;

      let returnStartAt: Date | null = null;
      let returnEndAt: Date | null = null;

      if (isSessionEventService) {
        if (
          !selectedServiceSession?.startAt ||
          !selectedServiceSession?.endAt
        ) {
          throw new Error(
            "This class or course session does not have valid dates"
          );
        }

        startAt = new Date(selectedServiceSession.startAt);
        endAt = new Date(selectedServiceSession.endAt);
      } else if (isStayService) {
        if (isBoarding) {
          const dropoffTime =
            selectedBoardingDropoffWindow?.startTime || "09:00";

          const collectionTime =
            selectedBoardingCollectionWindow?.endTime || "09:00";

          startAt = new Date(`${arrivalDate}T${dropoffTime}`);
          endAt = new Date(`${departureDate}T${collectionTime}`);
        } else {
          startAt = new Date(`${arrivalDate}T09:00`);
          endAt = new Date(`${departureDate}T09:00`);
        }
      } else if (isBlockCapacityService) {
        const blockTimes = buildBookingBlockTimes(
          date,
          resolvedBlock!
        );

        if (!blockTimes.startAt || !blockTimes.endAt) {
          throw new Error("Invalid booking block time");
        }

        startAt = blockTimes.startAt;
        endAt = blockTimes.endAt;
      } else {
        startAt = new Date(selectedSlot!);

        const bookingDurationMinutes = isGrooming
          ? appointmentDurationMinutes *
            Math.max(1, selectedDogIds.length)
          : appointmentDurationMinutes;

        endAt = new Date(
          startAt.getTime() + bookingDurationMinutes * 60000
        );
      }

      if (
        Number.isNaN(startAt.getTime()) ||
        Number.isNaN(endAt.getTime())
      ) {
        throw new Error("Invalid booking date or time");
      }

      if (
        isPetTransport &&
        journeyType === "RETURN"
      ) {
        returnStartAt = new Date(selectedReturnSlot!);

        returnEndAt = new Date(
          returnStartAt.getTime() +
            appointmentDurationMinutes * 60000
        );

        if (
          Number.isNaN(returnStartAt.getTime()) ||
          Number.isNaN(returnEndAt.getTime())
        ) {
          throw new Error("Invalid return date or time");
        }

        if (returnStartAt <= endAt) {
          return alert(
            "The return journey must start after the outbound journey ends."
          );
        }
      }

      const bookingResponse = await api.post("/api/bookings", {
        supplierId,
        supplierServiceId: service.id,
        bookingBlockId:
          isBlockCapacityService && resolvedBlock
            ? resolvedBlock.id
            : undefined,

        serviceSessionId: isSessionEventService
          ? selectedServiceSession?.id
          : undefined,

        serviceType,
        startAt,
        endAt,

        returnStartAt:
          isPetTransport &&
          journeyType === "RETURN" &&
          returnStartAt
            ? returnStartAt
            : undefined,

        returnEndAt:
          isPetTransport &&
          journeyType === "RETURN" &&
          returnEndAt
            ? returnEndAt
            : undefined,

        journeyType: isPetTransport
          ? journeyType
          : undefined,

        dogIds: selectedDogIds,
        dogCount: selectedDogIds.length,

        kennelType: isBoarding
          ? kennelType
          : undefined,

        notes:
          buildNotes({
            returnStartAt,
            returnEndAt,
          }) || undefined,

        accessInstructions: shouldShowAccessInstructions
          ? accessInstructions.trim() || undefined
          : undefined,

        healthSafetyAccepted: acceptedHealthSafety,

        petSittingLocation: isPetSitting
          ? petSittingLocation
          : undefined,

        mobileVetOffering: isMobileVet
          ? mobileVetService
          : undefined,

        groomingSelections: isGrooming
          ? groomingSelections
          : undefined,

        daycareType: isDaycare
          ? daycareSessionType
          : undefined,

        halfDayPeriod:
          isDaycare &&
          daycareSessionType === "HALF_DAY"
            ? halfDayPeriod
            : undefined,
      });

      trackEvent("booking_request_submitted", {
        bookingId:
          bookingResponse.data?.booking?.id ||
          bookingResponse.data?.id ||
          null,

        supplierId,
        supplierName: supplierName || null,
        supplierServiceId: service.id,
        serviceType,
        dogCount: selectedDogIds.length,

        journeyType: isPetTransport
          ? journeyType
          : null,

        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),

        returnStartAt: returnStartAt
          ? returnStartAt.toISOString()
          : null,

        returnEndAt: returnEndAt
          ? returnEndAt.toISOString()
          : null,

        estimatedPriceCents: displayPrice,
      });

      alert("✅ Booking request sent");
      onClose();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setAuthRequired(true);
        alert("Please log in as an owner to book.");
      } else {
        alert(
          e?.response?.data?.error ||
            e?.message ||
            "Error"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const dateInputClass =
    "block w-full max-w-full min-w-0 appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-base leading-tight";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-3 py-4">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-start">
        <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="shrink-0 border-b px-5 py-4">
            <h2 className="text-xl font-semibold">
              Book {formatServiceName(serviceType)}
            </h2>

            <p className="text-sm text-gray-500">
              {displaySubtitle}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-5 py-4 pb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Select dog(s)
              </p>

              {authRequired ? (
                <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-medium">
                    Please log in to book this service.
                  </p>

                  <Link
                    to="/auth/login"
                    className="mt-2 inline-block underline"
                  >
                    Log in as an owner
                  </Link>
                </div>
              ) : dogsLoading ? (
                <p className="text-sm text-gray-400">
                  Loading dogs...
                </p>
              ) : dogs.length === 0 ? (
                <p className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  No dogs found. Please add a dog to your
                  owner profile first.
                </p>
              ) : (
                dogs.map((dog) => (
                  <label
                    key={dog.id}
                    className="flex cursor-pointer items-center gap-3 rounded border px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDogIds.includes(dog.id)}
                      onChange={() => toggleDog(dog.id)}
                    />

                    <span>
                      {dog.name}
                      {dog.breed
                        ? ` • ${dog.breed}`
                        : ""}
                    </span>
                  </label>
                ))
              )}

              {maxDogsPerBooking > 0 ? (
                <p className="text-xs text-gray-500">
                  Maximum dogs allowed for this booking:{" "}
                  {maxDogsPerBooking}
                </p>
              ) : null}

              {isWalking && !walkingAdditionalDogEnabled ? (
                <p className="text-xs text-gray-500">
                  This walker allows one dog per household booking.
                </p>
              ) : null}
            </div>

            {isBoarding ? (
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-sm font-medium">
                  Kennel preference
                </p>

                <select
                  className="w-full rounded border px-3 py-2"
                  value={kennelType}
                  onChange={(e) =>
                    setKennelType(
                      e.target.value as KennelType
                    )
                  }
                  disabled={authRequired}
                >
                  <option value="SOCIAL">
                    Social kennel
                  </option>

                  <option value="PRIVATE">
                    Individual kennel
                  </option>
                </select>
              </div>
            ) : null}

            {isDaycare ? (
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-sm font-medium">
                  Daycare session
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDaycareSessionType("HALF_DAY")
                    }
                    disabled={authRequired}
                    className={`rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                      daycareSessionType === "HALF_DAY"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    Half day
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDaycareSessionType("FULL_DAY")
                    }
                    disabled={authRequired}
                    className={`rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                      daycareSessionType === "FULL_DAY"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    Full day
                  </button>
                </div>

                {daycareSessionType === "HALF_DAY" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setHalfDayPeriod("MORNING")
                      }
                      disabled={authRequired}
                      className={`rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                        halfDayPeriod === "MORNING"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      Morning
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setHalfDayPeriod("AFTERNOON")
                      }
                      disabled={authRequired}
                      className={`rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                        halfDayPeriod === "AFTERNOON"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      Afternoon
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isBlockCapacityService &&
bookingBlocks.length > 0 ? (
  <div className="rounded-lg border border-gray-200 p-3">
    <p className="mb-2 text-sm font-medium">
      Select booking option
    </p>

    <div className="space-y-2">
      {bookingBlocks.map((block) => (
        <button
          key={block.id}
          type="button"
          disabled={authRequired}
          onClick={() =>
            setSelectedBookingBlockId(block.id)
          }
          className={`w-full rounded border px-3 py-3 text-left text-sm disabled:opacity-50 ${
            selectedBookingBlockId === block.id
              ? "border-blue-600 bg-blue-50"
              : "bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {block.label}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {block.startTime} – {block.endTime}
              </p>
            </div>

            <span className="font-medium">
              {formatPrice(block.priceCents)}
            </span>
          </div>
        </button>
      ))}
    </div>
  </div>
) : null}

            {shouldRequireOwnerAddress &&
            ownerAddress ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium text-blue-900">
                  Service address
                </p>

                <p className="mt-1 whitespace-pre-line">
                  {ownerAddress}
                </p>
              </div>
            ) : null}

           {isSessionEventService ? (
  <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
    <p className="font-semibold text-blue-950">
      {selectedServiceSession?.name ||
        "Selected class or course"}
    </p>

    {selectedServiceSession?.description ? (
      <p className="mt-2 text-sm text-blue-900">
        {selectedServiceSession.description}
      </p>
    ) : null}

    <div className="mt-3 space-y-1 text-sm text-blue-900">
      <p>
        <span className="font-medium">Starts:</span>{" "}
        {formatBookingDateTime(
          selectedServiceSession?.startAt
        )}
      </p>

      <p>
        <span className="font-medium">Ends:</span>{" "}
        {formatBookingDateTime(
          selectedServiceSession?.endAt
        )}
      </p>

      <p>
        <span className="font-medium">Price:</span>{" "}
        {formatPrice(
          selectedServiceSession?.priceCents
        )}{" "}
        per dog
      </p>

      {selectedServiceSession?.capacityDogs ? (
        selectedServiceSession.remainingCapacityDogs != null ? (
          <p>
            <span className="font-medium">Availability:</span>{" "}
            {selectedServiceSession.remainingCapacityDogs} of{" "}
            {selectedServiceSession.capacityDogs} spaces remaining
          </p>
        ) : (
          <p>
            <span className="font-medium">Class capacity:</span>{" "}
              {selectedServiceSession.capacityDogs} dogs
        </p>
        )
      ) : null}
    </div>

    <p className="mt-3 text-xs text-blue-800">
      This class has fixed dates and times. You do not
      need to select another date or time.
    </p>
  </div>
) : isStayService ? (
  <div className="overflow-hidden rounded-lg border-2 border-blue-300 p-3">
    <p className="text-sm font-semibold">
      Select arrival and departure dates
    </p>

    <div className="space-y-3">
      <input
        type="date"
        className={dateInputClass}
        value={arrivalDate}
        onChange={(e) => {
          setArrivalDate(e.target.value);
          setSelectedBoardingDropoffIndex(null);
        }}
        disabled={authRequired}
      />

      <input
        type="date"
        className={dateInputClass}
        value={departureDate}
        min={arrivalDate || undefined}
        onChange={(e) => {
          setDepartureDate(e.target.value);
          setSelectedBoardingCollectionIndex(null);
        }}
        disabled={authRequired}
      />
    </div>

    {isBoarding && arrivalDate ? (
      <div className="mt-3">
        <p className="mb-1 text-sm font-medium">Drop-off window</p>

        {boardingDropoffWindows.length ? (
          <select
            className="w-full rounded border px-3 py-2"
            value={
              selectedBoardingDropoffIndex == null
                ? ""
                : String(selectedBoardingDropoffIndex)
            }
            disabled={authRequired}
            onChange={(e) =>
              setSelectedBoardingDropoffIndex(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          >
            <option value="">Select drop-off window</option>
            {boardingDropoffWindows.map((window, index) => (
              <option key={`dropoff-${index}`} value={index}>
                {formatBoardingWindow(window)}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-500">
            Standard drop-off time applies for this date.
          </p>
        )}
      </div>
    ) : null}

    {isBoarding && departureDate ? (
      <div className="mt-3">
        <p className="mb-1 text-sm font-medium">Collection window</p>

        {boardingCollectionWindows.length ? (
          <select
            className="w-full rounded border px-3 py-2"
            value={
              selectedBoardingCollectionIndex == null
                ? ""
                : String(selectedBoardingCollectionIndex)
            }
            disabled={authRequired}
            onChange={(e) =>
              setSelectedBoardingCollectionIndex(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          >
            <option value="">Select collection window</option>
            {boardingCollectionWindows.map((window, index) => (
              <option key={`collection-${index}`} value={index}>
                {formatBoardingWindow(window)}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-500">
            Standard collection time applies for this date.
          </p>
        )}
      </div>
    ) : null}

    {isPetSitting ? (
      <div className="mt-3">
        <p className="mb-1 text-sm font-medium">
          Pet sitting location
        </p>

        <select
          className="w-full rounded border px-3 py-2"
          value={petSittingLocation}
          disabled={authRequired}
          onChange={(e) =>
            setPetSittingLocation(
              e.target.value as PetSittingLocation
            )
          }
        >
          <option value="OWNER_HOME">
            Owner home
          </option>

          <option value="SITTER_HOME">
            Sitter home
          </option>
        </select>
      </div>
    ) : null}
  </div>
) : (
  <div className="overflow-hidden rounded-lg border-2 border-blue-300 p-3">
    <p className="text-sm font-semibold">
      {isBlockCapacityService
        ? isDaycare
          ? "Select daycare date"
          : "Select booking date"
        : isPetTransport
        ? "Select outbound date and time"
        : "Select date and time"}
    </p>

    <p className="mb-3 text-xs text-gray-500">
      {isBlockCapacityService
        ? isDaycare
          ? "Choose the date for this daycare session."
          : "Choose the date for this booking."
        : isPetTransport
        ? "Choose the date and time for the outbound journey."
        : "Choose a date first, then pick an available time slot."}
    </p>

    <input
      type="date"
      className={dateInputClass}
      value={date}
      disabled={authRequired}
      onChange={(e) => {
        setDate(e.target.value);
        setSelectedSlot(null);

        if (
          returnDate &&
          e.target.value > returnDate
        ) {
          setReturnDate(e.target.value);
          setSelectedReturnSlot(null);
        }
      }}
    />

    {usesTimeSlots &&
    date &&
    slots.length === 0 ? (
      <p className="mt-2 text-xs text-red-600">
        No available time slots for this date.
      </p>
    ) : null}
  </div>
)} 

            {usesTimeSlots && slots.length > 0 ? (
              <div>
                {isPetTransport ? (
                  <p className="mb-2 text-sm font-medium">
                    Outbound time
                  </p>
                ) : null}

                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id || slot.startTime}
                      type="button"
                      disabled={authRequired}
                      onClick={() =>
                        setSelectedSlot(slot.startTime)
                      }
                      className={`rounded border p-2 text-sm disabled:opacity-50 ${
                        selectedSlot === slot.startTime
                          ? "bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      {new Date(
                        slot.startTime
                      ).toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isGrooming ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium">
                  Grooming options per dog
                </p>

                {selectedDogIds.map((dogId) => {
                  const dog = dogs.find(
                    (item) => item.id === dogId
                  );

                  const selection =
                    groomingSelections[dogId] || {
                      category: String(
                        groomingCategories[0] || ""
                      ),
                      size: dog?.size || "",
                    };

                  const sizesForCategory =
                    groomingTiers.filter(
                      (tier) =>
                        tier.category ===
                        selection.category
                    );

                  return (
                    <div
                      key={dogId}
                      className="space-y-2 rounded border p-3"
                    >
                      <p className="text-sm font-medium">
                        {dog?.name || "Dog"}
                      </p>

                      <select
                        className="w-full rounded border px-3 py-2"
                        value={selection.category}
                        disabled={authRequired}
                        onChange={(e) =>
                          setGroomingSelections(
                            (prev) => ({
                              ...prev,
                              [dogId]: {
                                category:
                                  e.target.value,
                                size: "",
                              },
                            })
                          )
                        }
                      >
                        {groomingCategories.map(
                          (category) => (
                            <option
                              key={String(category)}
                              value={String(category)}
                            >
                              {formatLabel(
                                String(category)
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        className="w-full rounded border px-3 py-2"
                        value={selection.size}
                        disabled={authRequired}
                        onChange={(e) =>
                          setGroomingSelections(
                            (prev) => ({
                              ...prev,
                              [dogId]: {
                                ...selection,
                                size: e.target.value,
                              },
                            })
                          )
                        }
                      >
                        <option value="">
                          Select size
                        </option>

                        {sizesForCategory.map(
                          (tier) => (
                            <option
                              key={tier.id}
                              value={tier.dogSize}
                            >
                              {formatLabel(
                                tier.dogSize
                              )}{" "}
                              —{" "}
                              {formatPrice(
                                tier.priceCents
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  );
                })}

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isMobileGrooming}
                    disabled={authRequired}
                    onChange={(e) =>
                      setIsMobileGrooming(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Mobile grooming at owner home
                  </span>
                </label>
              </div>
            ) : null}

            {isPetTransport ? (
              <div className="space-y-4 rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Journey type
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={authRequired}
                      onClick={() =>
                        setJourneyType("ONE_WAY")
                      }
                      className={`rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                        journeyType === "ONE_WAY"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      One way
                      <span className="mt-1 block text-xs">
                        {formatPrice(
                          petTransportOneWayPriceCents
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={authRequired}
                      onClick={() =>
                        setJourneyType("RETURN")
                      }
                      className={`rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                        journeyType === "RETURN"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      Return
                      <span className="mt-1 block text-xs">
                        {formatPrice(
                          petTransportReturnPriceCents
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">
                    Outbound journey
                  </p>

                  {ownerAddress ? (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded border px-3 py-2 text-sm"
                        disabled={authRequired}
                        onClick={() =>
                          setPickup(ownerAddress)
                        }
                      >
                        Use home as pickup
                      </button>

                      <button
                        type="button"
                        className="rounded border px-3 py-2 text-sm"
                        disabled={authRequired}
                        onClick={() =>
                          setDropoff(ownerAddress)
                        }
                      >
                        Use home as drop-off
                      </button>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <input
                      placeholder="Pickup location"
                      className="w-full rounded border px-3 py-2"
                      value={pickup}
                      disabled={authRequired}
                      onChange={(e) =>
                        setPickup(e.target.value)
                      }
                    />

                    <input
                      placeholder="Drop-off location"
                      className="w-full rounded border px-3 py-2"
                      value={dropoff}
                      disabled={authRequired}
                      onChange={(e) =>
                        setDropoff(e.target.value)
                      }
                    />
                  </div>
                </div>

                {journeyType === "RETURN" ? (
                  <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Return journey
                      </p>

                      <p className="mt-1 text-xs text-blue-800">
                        The return trip will collect your
                        dog from the outbound destination
                        and return them to the original
                        pickup point.
                      </p>
                    </div>

                    <div className="rounded border border-blue-200 bg-white p-3 text-sm">
                      <p>
                        <span className="font-medium">
                          Return pickup:
                        </span>{" "}
                        {dropoff.trim() ||
                          "Enter the outbound drop-off location"}
                      </p>

                      <p className="mt-1">
                        <span className="font-medium">
                          Return drop-off:
                        </span>{" "}
                        {pickup.trim() ||
                          "Enter the outbound pickup location"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-blue-900">
                        Select return date
                      </p>

                      <input
                        type="date"
                        className={dateInputClass}
                        value={returnDate}
                        min={date || undefined}
                        disabled={authRequired}
                        onChange={(e) => {
                          setReturnDate(
                            e.target.value
                          );
                          setSelectedReturnSlot(null);
                        }}
                      />
                    </div>

                    {returnDate &&
                    returnSlots.length === 0 ? (
                      <p className="text-xs text-red-600">
                        No available return time slots
                        for this date.
                      </p>
                    ) : null}

                    {returnSlots.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-medium text-blue-900">
                          Select return time
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                          {returnSlots.map((slot) => (
                            <button
                              key={
                                slot.id ||
                                slot.startTime
                              }
                              type="button"
                              disabled={
                                authRequired
                              }
                              onClick={() =>
                                setSelectedReturnSlot(
                                  slot.startTime
                                )
                              }
                              className={`rounded border p-2 text-sm disabled:opacity-50 ${
                                selectedReturnSlot ===
                                slot.startTime
                                  ? "bg-blue-600 text-white"
                                  : "bg-white"
                              }`}
                            >
                              {new Date(
                                slot.startTime
                              ).toLocaleTimeString(
                                "en-ZA",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {isMobileVet ? (
              <select
                className="w-full rounded border px-3 py-2"
                value={mobileVetService}
                disabled={authRequired}
                onChange={(e) =>
                  setMobileVetService(e.target.value)
                }
              >
                {mobileOptions.map((option) => (
                  <option
                    key={option.key}
                    value={option.key}
                  >
                    {option.label ||
                      formatLabel(option.key)}
                  </option>
                ))}
              </select>
            ) : null}

            {shouldShowAccessInstructions ? (
              <div>
                <textarea
                  className="min-h-[90px] w-full rounded border px-3 py-2"
                  placeholder="Optional access notes, e.g. estate name, parking or entry instructions."
                  value={accessInstructions}
                  disabled={authRequired}
                  onChange={(e) =>
                    setAccessInstructions(
                      e.target.value
                    )
                  }
                />

                <p className="mt-1 text-xs text-gray-500">
                  Please don&apos;t add gate codes yet.
                  You can share secure access details with
                  the supplier once the booking is
                  confirmed.
                </p>
              </div>
            ) : null}

            <textarea
              className="min-h-[100px] w-full rounded border px-3 py-2"
              placeholder="Anything the supplier should know"
              value={notes}
              disabled={authRequired}
              onChange={(e) =>
                setNotes(e.target.value)
              }
            />
          </div>

          <div className="shrink-0 border-t bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <label className="mb-3 flex items-start gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={acceptedHealthSafety}
                disabled={authRequired}
                onChange={(e) =>
                  setAcceptedHealthSafety(
                    e.target.checked
                  )
                }
                className="mt-1"
              />

              <span>
                I confirm my pet information is accurate,
                vaccinations are up to date where
                required, and I agree to the{" "}
                <a
                  href="/legal/health-safety"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Health & Safety Policy
                </a>
                .
              </span>
            </label>

            <button
              onClick={handleBooking}
              disabled={
                loading ||
                dogsLoading ||
                authRequired
              }
              className="w-full rounded bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
            >
              {authRequired
                ? "Log in to book"
                : loading
                ? "Sending Request..."
                : "Request Booking"}
            </button>

            <button
              onClick={onClose}
              className="mt-3 w-full py-2 text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
