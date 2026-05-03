import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface Props {
  supplierId: string;
  service: any;
  onClose: () => void;
}

type KennelType = "SOCIAL" | "PRIVATE";
type PetSittingLocation = "OWNER_HOME" | "SITTER_HOME";
type PetTransportJourneyType = "ONE_WAY" | "RETURN";
type DaycareSessionType = "HALF_DAY" | "FULL_DAY";
type HalfDayPeriod = "MORNING" | "AFTERNOON";

interface Dog {
  id: string;
  name: string;
  breed?: string | null;
}

interface SupplierAvailability {
  dayOfWeek?: string | number;
  day?: string | number;
  weekday?: string | number;
  isAvailable?: boolean;
  available?: boolean;
  enabled?: boolean;
  startTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
  openTime?: string;
  closeTime?: string;
  opensAt?: string;
  closesAt?: string;
  from?: string;
  to?: string;
  startAt?: string;
  endAt?: string;
}

const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function formatServiceName(value?: string) {
  return String(value || "SERVICE").replace(/_/g, " ");
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

function getStayDays(arrivalDate: string, departureDate: string) {
  if (!arrivalDate || !departureDate) return 1;

  const start = new Date(`${arrivalDate}T09:00:00`);
  const end = new Date(`${departureDate}T09:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  if (end <= start) return 1;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
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

function normaliseTime(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function dateToWeekday(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return WEEKDAYS[parsed.getDay()];
}

function getAvailabilityDay(value: SupplierAvailability) {
  const rawDay = value.dayOfWeek ?? value.day ?? value.weekday;

  if (typeof rawDay === "number") {
    return WEEKDAYS[rawDay];
  }

  if (typeof rawDay === "string" && /^\d+$/.test(rawDay)) {
    return WEEKDAYS[Number(rawDay)];
  }

  return String(rawDay || "").toUpperCase();
}

function getAvailabilityStart(value: any) {
  return normaliseTime(
    value.startTime ||
      value.start ||
      value.openTime ||
      value.opensAt ||
      value.from ||
      value.startAt
  );
}

function getAvailabilityEnd(value: any) {
  return normaliseTime(
    value.endTime ||
      value.end ||
      value.closeTime ||
      value.closesAt ||
      value.to ||
      value.endAt
  );
}

function isAvailabilityEnabled(value: SupplierAvailability) {
  if (value.isAvailable === false) return false;
  if (value.available === false) return false;
  if (value.enabled === false) return false;
  return true;
}

function getAvailabilityForDate(
  date: string,
  availability: SupplierAvailability[]
) {
  if (!date || !Array.isArray(availability)) return null;

  const weekday = dateToWeekday(date);

  const match = availability.find((item) => {
    return getAvailabilityDay(item) === weekday && isAvailabilityEnabled(item);
  });

  if (!match) return null;

  const startTime = getAvailabilityStart(match);
  const endTime = getAvailabilityEnd(match);

  if (!startTime || !endTime) return null;

  return {
    startTime,
    endTime,
  };
}

function minutesFromTime(time: string) {
  const [hours, minutes] = normaliseTime(time).split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${normaliseTime(time)}:00`);
}

function generateAvailabilitySlots(
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number
) {
  const slots: string[] = [];

  const startMinutes = minutesFromTime(startTime);
  const endMinutes = minutesFromTime(endTime);
  const safeDuration = Math.max(15, durationMinutes || 60);

  for (
    let currentMinutes = startMinutes;
    currentMinutes + safeDuration <= endMinutes;
    currentMinutes += 60
  ) {
    slots.push(buildDateTime(date, timeFromMinutes(currentMinutes)).toISOString());
  }

  return slots;
}

function buildDaycareTimes(
  date: string,
  daycareSessionType: DaycareSessionType,
  halfDayPeriod: HalfDayPeriod,
  availabilityForDate: { startTime: string; endTime: string } | null
) {
  if (!date || !availabilityForDate) {
    return {
      startAt: null as Date | null,
      endAt: null as Date | null,
    };
  }

  const startMinutes = minutesFromTime(availabilityForDate.startTime);
  const endMinutes = minutesFromTime(availabilityForDate.endTime);
  const midpointMinutes = Math.floor((startMinutes + endMinutes) / 2);

  if (daycareSessionType === "FULL_DAY") {
    return {
      startAt: buildDateTime(date, availabilityForDate.startTime),
      endAt: buildDateTime(date, availabilityForDate.endTime),
    };
  }

  if (halfDayPeriod === "AFTERNOON") {
    return {
      startAt: buildDateTime(date, timeFromMinutes(midpointMinutes)),
      endAt: buildDateTime(date, availabilityForDate.endTime),
    };
  }

  return {
    startAt: buildDateTime(date, availabilityForDate.startTime),
    endAt: buildDateTime(date, timeFromMinutes(midpointMinutes)),
  };
}

export default function BookingModal({ supplierId, service, onClose }: Props) {
  const serviceType = service?.service || "WALKING";

  const isBoarding = serviceType === "BOARDING";
  const isPetSitting = serviceType === "PET_SITTING";
  const isMobileVet = serviceType === "MOBILE_VET";
  const isPetTransport = serviceType === "PET_TRANSPORT";
  const isGrooming = serviceType === "GROOMING";
  const isWalking = serviceType === "WALKING";
  const isTraining = serviceType === "TRAINING";
  const isDaycare = serviceType === "DAYCARE";

  const isStayService = isBoarding || isPetSitting;
  const usesTimeSlots = !isStayService && !isDaycare;
  const appointmentDurationMinutes = Number(service?.durationMinutes || 60);

  const [ownerAddress, setOwnerAddress] = useState("");
  const [date, setDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [supplierAvailability, setSupplierAvailability] = useState<
    SupplierAvailability[]
  >([]);

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const [notes, setNotes] = useState("");
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

  const groomingTiers: any[] = Array.isArray(service?.pricingTiers)
    ? service.pricingTiers
    : [];

  const groomingCategories = Array.from(
    new Set(groomingTiers.map((tier) => tier.category).filter(Boolean))
  );

  const [groomingCategory, setGroomingCategory] = useState("");
  const [groomingSize, setGroomingSize] = useState("");
  const [isMobileGrooming, setIsMobileGrooming] = useState(false);

  const availableGroomingSizes = useMemo(() => {
    return groomingTiers.filter((tier) => tier.category === groomingCategory);
  }, [groomingTiers, groomingCategory]);

  const selectedGroomingTier = useMemo(() => {
    return (
      groomingTiers.find(
        (tier) =>
          tier.category === groomingCategory && tier.dogSize === groomingSize
      ) || null
    );
  }, [groomingTiers, groomingCategory, groomingSize]);

  const mobileOptions: string[] = Array.isArray(service?.pricingJson?.offerings)
    ? service.pricingJson.offerings
    : ["CHECK_UP", "INOCULATIONS", "FOLLOW_UP", "OTHER"];

  const [mobileVetService, setMobileVetService] = useState(
    mobileOptions[0] || "CHECK_UP"
  );

  const shouldRequireOwnerAddress =
    isWalking ||
    isTraining ||
    isMobileVet ||
    isMobileGrooming ||
    (isPetSitting && petSittingLocation === "OWNER_HOME");

  const availabilityForSelectedDate = useMemo(() => {
    return getAvailabilityForDate(date, supplierAvailability);
  }, [date, supplierAvailability]);

  const stayDays = useMemo(
    () => getStayDays(arrivalDate, departureDate),
    [arrivalDate, departureDate]
  );

  const maxDogsPerBooking = useMemo(() => {
    return toNumber(service?.maxDogsPerBooking);
  }, [service?.maxDogsPerBooking]);

  const boardingBaseRateCents = useMemo(() => {
    return toNumber(service?.baseRateCents);
  }, [service?.baseRateCents]);

  const boardingAdditionalDogEnabled = useMemo(() => {
    const directEnabled = toBoolean(service?.additionalDogEnabled);
    const pricingJsonEnabled = toBoolean(service?.pricingJson?.additionalDogEnabled);
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
      if (boardingAdditionalDogEnabled && boardingAdditionalDogPriceCents > 0) {
        total += boardingAdditionalDogPriceCents * (dogCount - 1) * stayDays;
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
    const pricingJsonEnabled = toBoolean(service?.pricingJson?.additionalDogEnabled);
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
      if (daycareAdditionalDogEnabled && daycareAdditionalDogPriceCents > 0) {
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

  const displayPrice = useMemo(() => {
    if (isBoarding) {
      return estimatedBoardingTotalCents ?? boardingBaseRateCents;
    }

    if (isDaycare) {
      return estimatedDaycareTotalCents ?? daycareBaseSessionPriceCents;
    }

    if (isGrooming && selectedGroomingTier?.priceCents) {
      return selectedGroomingTier.priceCents;
    }

    return service?.baseRateCents;
  }, [
    isBoarding,
    estimatedBoardingTotalCents,
    boardingBaseRateCents,
    isDaycare,
    estimatedDaycareTotalCents,
    daycareBaseSessionPriceCents,
    isGrooming,
    selectedGroomingTier,
    service?.baseRateCents,
  ]);

  const displaySubtitle = useMemo(() => {
    if (isBoarding) {
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

      return `${formatPrice(displayPrice)} total • ${sessionLabel} • ${dogCount} dog${
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
    arrivalDate,
    departureDate,
    selectedDogIds.length,
    stayDays,
    displayPrice,
    boardingBaseRateCents,
    isDaycare,
    daycareSessionType,
    halfDayPeriod,
    service?.unit,
  ]);

  useEffect(() => {
    api.get("/api/owner/profile").then((res) => {
      const address = res.data?.profile?.address || "";
      setOwnerAddress(address);

      if (isPetTransport && address) {
        setPickup(address);
      }
    });

    api.get("/api/owner/dogs").then((res) => {
      setDogs(res.data?.dogs || []);
    });
  }, [isPetTransport]);

  useEffect(() => {
    api
      .get(`/api/public/suppliers/${supplierId}`)
      .then((res) => {
        const supplier =
          res.data?.supplier ||
          res.data?.profile ||
          res.data?.data ||
          res.data ||
          {};

        const availability =
          supplier.availability ||
          supplier.availabilities ||
          supplier.supplierAvailability ||
          supplier.operatingHours ||
          [];

        setSupplierAvailability(Array.isArray(availability) ? availability : []);
      })
      .catch(() => {
        setSupplierAvailability([]);
      });
  }, [supplierId]);

  useEffect(() => {
    if (!usesTimeSlots || !date) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    if (!availabilityForSelectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    const generatedSlots = generateAvailabilitySlots(
      date,
      availabilityForSelectedDate.startTime,
      availabilityForSelectedDate.endTime,
      appointmentDurationMinutes
    );

    setSlots(generatedSlots);
    setSelectedSlot(null);
  }, [
    date,
    usesTimeSlots,
    availabilityForSelectedDate,
    appointmentDurationMinutes,
  ]);

  useEffect(() => {
    if (isGrooming && groomingCategories.length > 0 && !groomingCategory) {
      setGroomingCategory(String(groomingCategories[0]));
    }
  }, [isGrooming, groomingCategories, groomingCategory]);

  useEffect(() => {
    if (
      isGrooming &&
      availableGroomingSizes.length > 0 &&
      !availableGroomingSizes.some((tier) => tier.dogSize === groomingSize)
    ) {
      setGroomingSize(availableGroomingSizes[0].dogSize);
    }
  }, [isGrooming, availableGroomingSizes, groomingSize]);

  function toggleDog(id: string) {
    setSelectedDogIds((prev) =>
      prev.includes(id) ? prev.filter((dogId) => dogId !== id) : [...prev, id]
    );
  }

  function buildNotes() {
    const parts: string[] = [];

    if (shouldRequireOwnerAddress && ownerAddress) {
      parts.push("Service location: OWNER_HOME.");
      parts.push(`Owner address: ${ownerAddress}.`);
    }

    if (isTraining) parts.push("Training location: owner home.");

    if (isBoarding) parts.push(`Kennel type: ${kennelType}.`);

    if (isPetSitting) {
      parts.push(`Pet sitting location: ${petSittingLocation}.`);
    }

    if (isPetTransport) {
      parts.push(`Journey type: ${formatLabel(journeyType)}.`);
      parts.push(`Pickup point: ${pickup.trim()}.`);
      parts.push(`Drop-off point: ${dropoff.trim()}.`);
    }

    if (isMobileVet) parts.push(`Mobile vet service: ${mobileVetService}.`);

    if (isGrooming) {
      parts.push(`Grooming option: ${groomingCategory}.`);
      parts.push(`Size: ${groomingSize}.`);
      if (isMobileGrooming) parts.push("Mobile grooming.");
    }

    if (isDaycare) {
      parts.push(`Daycare type: ${daycareSessionType}.`);
      if (daycareSessionType === "HALF_DAY") {
        parts.push(`Half day period: ${halfDayPeriod}.`);
      }
    }

    if (notes.trim()) parts.push(notes.trim());

    return parts.join(" ");
  }

  async function handleBooking() {
    if (selectedDogIds.length === 0) return alert("Select at least one dog");

    if (maxDogsPerBooking > 0 && selectedDogIds.length > maxDogsPerBooking) {
      return alert(
        `You can only book up to ${maxDogsPerBooking} dog(s) for this service`
      );
    }

    if (isStayService && (!arrivalDate || !departureDate)) {
      return alert("Select arrival and departure dates");
    }

    if (isDaycare && !date) {
      return alert("Select a daycare date");
    }

    if (!isStayService && !isDaycare && !date) {
      return alert("Select a date");
    }

    if ((isDaycare || usesTimeSlots) && !availabilityForSelectedDate) {
      return alert("The supplier is not available on this date");
    }

    if (!isStayService && !isDaycare && !selectedSlot) {
      return alert("Select a time");
    }

    if (shouldRequireOwnerAddress && !ownerAddress) {
      return alert("Please add your home address in your profile first");
    }

    if (isPetTransport && (!pickup.trim() || !dropoff.trim())) {
      return alert("Enter pickup and drop-off points");
    }

    if (isGrooming && (!groomingCategory || !groomingSize)) {
      return alert("Select grooming option and dog size");
    }

    setLoading(true);

    try {
      let startAt: Date;
      let endAt: Date;

      if (isStayService) {
        startAt = new Date(`${arrivalDate}T09:00`);
        endAt = new Date(`${departureDate}T09:00`);
      } else if (isDaycare) {
        const daycareTimes = buildDaycareTimes(
          date,
          daycareSessionType,
          halfDayPeriod,
          availabilityForSelectedDate
        );

        if (!daycareTimes.startAt || !daycareTimes.endAt) {
          throw new Error("Invalid daycare time");
        }

        startAt = daycareTimes.startAt;
        endAt = daycareTimes.endAt;
      } else {
        startAt = new Date(selectedSlot!);
        endAt = new Date(
          startAt.getTime() + appointmentDurationMinutes * 60000
        );
      }

      await api.post("/api/bookings", {
        supplierId,
        supplierServiceId: service.id,
        serviceType,
        startAt,
        endAt,
        dogIds: selectedDogIds,
        dogCount: selectedDogIds.length,
        kennelType: isBoarding ? kennelType : undefined,
        notes: buildNotes() || undefined,
        petSittingLocation: isPetSitting ? petSittingLocation : undefined,
        mobileVetOffering: isMobileVet ? mobileVetService : undefined,
        groomingCategory: isGrooming ? groomingCategory : undefined,
        groomingSize: isGrooming ? groomingSize : undefined,
        daycareType: isDaycare ? daycareSessionType : undefined,
        halfDayPeriod:
          isDaycare && daycareSessionType === "HALF_DAY"
            ? halfDayPeriod
            : undefined,
      });

      alert("✅ Booking request sent");
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Error");
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
            <p className="text-sm text-gray-500">{displaySubtitle}</p>
          </div>

          <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-5 py-4 pb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Select dog(s)</p>
              {dogs.map((dog) => (
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
                    {dog.breed ? ` • ${dog.breed}` : ""}
                  </span>
                </label>
              ))}

              {maxDogsPerBooking > 0 ? (
                <p className="text-xs text-gray-500">
                  Maximum dogs allowed for this booking: {maxDogsPerBooking}
                </p>
              ) : null}
            </div>

            {isBoarding ? (
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-sm font-medium">Kennel preference</p>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={kennelType}
                  onChange={(e) => setKennelType(e.target.value as KennelType)}
                >
                  <option value="SOCIAL">Social kennel</option>
                  <option value="PRIVATE">Individual kennel</option>
                </select>
              </div>
            ) : null}

            {isDaycare ? (
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-sm font-medium">Daycare session</p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDaycareSessionType("HALF_DAY")}
                    className={`rounded border px-3 py-2 text-sm ${
                      daycareSessionType === "HALF_DAY"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    Half day
                  </button>

                  <button
                    type="button"
                    onClick={() => setDaycareSessionType("FULL_DAY")}
                    className={`rounded border px-3 py-2 text-sm ${
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
                      onClick={() => setHalfDayPeriod("MORNING")}
                      className={`rounded border px-3 py-2 text-sm ${
                        halfDayPeriod === "MORNING"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      Morning
                    </button>

                    <button
                      type="button"
                      onClick={() => setHalfDayPeriod("AFTERNOON")}
                      className={`rounded border px-3 py-2 text-sm ${
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

            {shouldRequireOwnerAddress && ownerAddress ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium text-blue-900">Service address</p>
                <p className="mt-1 whitespace-pre-line">{ownerAddress}</p>
              </div>
            ) : null}

            {isStayService ? (
              <div className="rounded-lg border-2 border-blue-300 p-3 overflow-hidden">
                <p className="text-sm font-semibold">
                  Select arrival and departure dates
                </p>

                <div className="space-y-3">
                  <input
                    type="date"
                    className={dateInputClass}
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                  />

                  <input
                    type="date"
                    className={dateInputClass}
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>

                {isPetSitting ? (
                  <div className="mt-3">
                    <p className="mb-1 text-sm font-medium">Pet sitting location</p>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={petSittingLocation}
                      onChange={(e) =>
                        setPetSittingLocation(
                          e.target.value as PetSittingLocation
                        )
                      }
                    >
                      <option value="OWNER_HOME">Owner home</option>
                      <option value="SITTER_HOME">Sitter home</option>
                    </select>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-blue-300 p-3 overflow-hidden">
                <p className="text-sm font-semibold">
                  {isDaycare ? "Select daycare date" : "Select date and time"}
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  Times are based on this supplier’s saved availability.
                </p>

                <input
                  type="date"
                  className={dateInputClass}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                />

                {date && !availabilityForSelectedDate ? (
                  <p className="mt-2 text-xs text-red-600">
                    Supplier is not available on this date.
                  </p>
                ) : null}
              </div>
            )}

            {usesTimeSlots && slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded border p-2 text-sm ${
                      selectedSlot === slot ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                  >
                    {new Date(slot).toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            ) : null}

            {isGrooming ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <select
                  className="w-full rounded border px-3 py-2"
                  value={groomingCategory}
                  onChange={(e) => {
                    setGroomingCategory(e.target.value);
                    setGroomingSize("");
                  }}
                >
                  {groomingCategories.map((category) => (
                    <option key={String(category)} value={String(category)}>
                      {formatLabel(String(category))}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded border px-3 py-2"
                  value={groomingSize}
                  onChange={(e) => setGroomingSize(e.target.value)}
                >
                  {availableGroomingSizes.map((tier) => (
                    <option key={tier.id} value={tier.dogSize}>
                      {formatLabel(tier.dogSize)} — {formatPrice(tier.priceCents)}
                    </option>
                  ))}
                </select>

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isMobileGrooming}
                    onChange={(e) => setIsMobileGrooming(e.target.checked)}
                  />
                  <span>Mobile grooming at owner home</span>
                </label>
              </div>
            ) : null}

            {isPetTransport ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <select
                  className="w-full rounded border px-3 py-2"
                  value={journeyType}
                  onChange={(e) =>
                    setJourneyType(e.target.value as PetTransportJourneyType)
                  }
                >
                  <option value="ONE_WAY">One way</option>
                  <option value="RETURN">Return</option>
                </select>

                {ownerAddress ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded border px-3 py-2 text-sm"
                      onClick={() => setPickup(ownerAddress)}
                    >
                      Use home as pickup
                    </button>
                    <button
                      type="button"
                      className="rounded border px-3 py-2 text-sm"
                      onClick={() => setDropoff(ownerAddress)}
                    >
                      Use home as drop-off
                    </button>
                  </div>
                ) : null}

                <input
                  placeholder="Pickup location"
                  className="w-full rounded border px-3 py-2"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />

                <input
                  placeholder="Drop-off location"
                  className="w-full rounded border px-3 py-2"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                />
              </div>
            ) : null}

            {isMobileVet ? (
              <select
                className="w-full rounded border px-3 py-2"
                value={mobileVetService}
                onChange={(e) => setMobileVetService(e.target.value)}
              >
                {mobileOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            ) : null}

            <textarea
              className="min-h-[100px] w-full rounded border px-3 py-2"
              placeholder="Anything the supplier should know"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="shrink-0 border-t bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <button
              onClick={handleBooking}
              disabled={loading}
              className="w-full rounded bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Sending Request..." : "Request Booking"}
            </button>

            <button onClick={onClose} className="mt-3 w-full py-2 text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}