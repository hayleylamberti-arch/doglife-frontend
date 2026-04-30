import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface Props {
  supplierId: string;
  service: any;
  onClose: () => void;
}

type KennelType = "SOCIAL" | "PRIVATE";
type DaycareType = "FULL_DAY" | "HALF_DAY";
type HalfDayPeriod = "MORNING" | "AFTERNOON";
type PetSittingLocation = "OWNER_HOME" | "SITTER_HOME";
type PetTransportJourneyType = "ONE_WAY" | "RETURN";

interface Dog {
  id: string;
  name: string;
  breed?: string | null;
}

function formatServiceName(value?: string) {
  return String(value || "SERVICE").replace(/_/g, " ");
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function formatDogSize(value?: string | null) {
  if (!value) return "";
  return value.toLowerCase().replace(/^xl$/, "x large");
}

function formatLabel(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildLocalDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export default function BookingModal({ supplierId, service, onClose }: Props) {
  const serviceType = service?.service || "WALKING";

  const isBoarding = serviceType === "BOARDING";
  const isGrooming = serviceType === "GROOMING";
  const isDaycare = serviceType === "DAYCARE";
  const isPetSitting = serviceType === "PET_SITTING";
  const isMobileVet = serviceType === "MOBILE_VET";
  const isPetTransport = serviceType === "PET_TRANSPORT";
  const isTraining = serviceType === "TRAINING";
  const isWalking = serviceType === "WALKING";

  const isStayService = isBoarding || isPetSitting;
  const usesSlotSelection = !isStayService && !isDaycare;

  const appointmentDurationMinutes = Number(service?.durationMinutes || 60);

  const groomingTiers: any[] = Array.isArray(service?.pricingTiers)
    ? service.pricingTiers
    : [];

  const groomingCategories: string[] = Array.from(
    new Set(
      groomingTiers
        .map((tier: any) => String(tier.category || ""))
        .filter((category: string) => category.length > 0)
    )
  );

  const mobileVetOfferingOptions: string[] = Array.isArray(
    service?.pricingJson?.offerings
  )
    ? service.pricingJson.offerings
    : ["CHECK_UP", "INOCULATIONS", "EUTHANASIA", "FOLLOW_UP", "OTHER"];

  const [selectedGroomingCategory, setSelectedGroomingCategory] =
    useState<string>("");
  const [selectedGroomingSize, setSelectedGroomingSize] = useState<string>("");

  const [daycareType, setDaycareType] = useState<DaycareType>("FULL_DAY");
  const [halfDayPeriod, setHalfDayPeriod] =
    useState<HalfDayPeriod>("MORNING");

  const [petSittingLocation, setPetSittingLocation] =
    useState<PetSittingLocation>("OWNER_HOME");

  const [mobileVetOffering, setMobileVetOffering] = useState<string>(
    mobileVetOfferingOptions[0] || "CHECK_UP"
  );

  const [petTransportJourneyType, setPetTransportJourneyType] =
    useState<PetTransportJourneyType>("ONE_WAY");
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");

  const [ownerAddress, setOwnerAddress] = useState("");
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [bookingAddress, setBookingAddress] = useState("");

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [kennelType, setKennelType] = useState<KennelType>("SOCIAL");
  const [notes, setNotes] = useState("");

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [dogsLoading, setDogsLoading] = useState(false);

  const effectiveOwnerAddress = useSavedAddress ? ownerAddress : bookingAddress;

  const shouldRequireOwnerAddress =
    isWalking ||
    isTraining ||
    isMobileVet ||
    (isPetSitting && petSittingLocation === "OWNER_HOME");

  const availableSizesForCategory = useMemo(() => {
    if (!selectedGroomingCategory) return [];
    return groomingTiers.filter(
      (tier: any) => tier.category === selectedGroomingCategory
    );
  }, [groomingTiers, selectedGroomingCategory]);

  const selectedGroomingTier = useMemo(() => {
    if (!selectedGroomingCategory || !selectedGroomingSize) return null;

    return (
      groomingTiers.find(
        (tier: any) =>
          tier.category === selectedGroomingCategory &&
          tier.dogSize === selectedGroomingSize
      ) || null
    );
  }, [groomingTiers, selectedGroomingCategory, selectedGroomingSize]);

  const displayPrice = useMemo(() => {
    if (isGrooming && selectedGroomingTier?.priceCents) {
      return selectedGroomingTier.priceCents;
    }

    return service?.baseRateCents;
  }, [isGrooming, selectedGroomingTier, service?.baseRateCents]);

  const title = useMemo(() => {
    return `Book ${formatServiceName(serviceType)}`;
  }, [serviceType]);

  useEffect(() => {
    async function fetchOwnerProfile() {
      try {
        const res = await api.get("/api/owner/profile");
        const address = res.data?.profile?.address || "";
        setOwnerAddress(address);

        if (isPetTransport && address && !pickupPoint) {
          setPickupPoint(address);
        }
      } catch (err) {
        console.error("Failed to load owner profile", err);
      }
    }

    fetchOwnerProfile();
  }, []);

  useEffect(() => {
    async function fetchDogs() {
      setDogsLoading(true);

      try {
        const res = await api.get("/api/owner/dogs");
        setDogs(res.data?.dogs || []);
      } catch (err) {
        console.error("Failed to load dogs", err);
        setDogs([]);
      } finally {
        setDogsLoading(false);
      }
    }

    fetchDogs();
  }, []);

  useEffect(() => {
    if (!usesSlotSelection) return;

    if (!date) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    async function fetchAvailability() {
      try {
        const res = await api.get(
          `/api/suppliers/${supplierId}/availability?date=${date}`
        );
        setSlots(res.data?.slots || []);
      } catch (err) {
        console.error("Failed to load availability", err);
        setSlots([]);
      }
    }

    fetchAvailability();
  }, [supplierId, date, usesSlotSelection]);

  useEffect(() => {
    if (
      isGrooming &&
      groomingCategories.length > 0 &&
      !selectedGroomingCategory
    ) {
      setSelectedGroomingCategory(groomingCategories[0] || "");
    }
  }, [isGrooming, groomingCategories, selectedGroomingCategory]);

  useEffect(() => {
    if (
      isGrooming &&
      availableSizesForCategory.length > 0 &&
      !availableSizesForCategory.some(
        (tier: any) => tier.dogSize === selectedGroomingSize
      )
    ) {
      setSelectedGroomingSize(availableSizesForCategory[0].dogSize);
    }
  }, [isGrooming, availableSizesForCategory, selectedGroomingSize]);

  useEffect(() => {
    if (isMobileVet && mobileVetOfferingOptions.length > 0) {
      setMobileVetOffering((current) =>
        mobileVetOfferingOptions.includes(current)
          ? current
          : mobileVetOfferingOptions[0]
      );
    }
  }, [isMobileVet, mobileVetOfferingOptions]);

  function toggleDog(dogId: string) {
    setSelectedDogIds((prev) =>
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId]
    );
  }

  function buildOwnerHomeNotes() {
    if (!shouldRequireOwnerAddress) return [];

    return [
      "Service location: OWNER_HOME.",
      `Owner address: ${effectiveOwnerAddress.trim()}.`,
    ];
  }

  function buildAppointmentNotes() {
    const extraLines: string[] = [];

    extraLines.push(...buildOwnerHomeNotes());

    if (isTraining) {
      extraLines.push("Training location: owner home.");
    }

    if (isPetTransport) {
      extraLines.push(`Journey type: ${formatLabel(petTransportJourneyType)}.`);
      extraLines.push(`Pickup point: ${pickupPoint.trim()}.`);
      extraLines.push(`Drop-off point: ${dropoffPoint.trim()}.`);
    }

    if (notes.trim()) {
      extraLines.push(notes.trim());
    }

    return extraLines.join(" ");
  }

  function buildStayNotes() {
    const extraLines: string[] = [];

    if (isPetSitting) {
      extraLines.push(`Pet sitting location: ${petSittingLocation}.`);

      if (petSittingLocation === "OWNER_HOME") {
        extraLines.push("Service location: OWNER_HOME.");
        extraLines.push(`Owner address: ${effectiveOwnerAddress.trim()}.`);
      }
    }

    if (notes.trim()) {
      extraLines.push(notes.trim());
    }

    return extraLines.join(" ");
  }

  function getDaycareWindow() {
    if (!date) return null;

    if (daycareType === "FULL_DAY") {
      return {
        start: buildLocalDateTime(date, "08:00"),
        end: buildLocalDateTime(date, "17:00"),
      };
    }

    if (halfDayPeriod === "MORNING") {
      return {
        start: buildLocalDateTime(date, "08:00"),
        end: buildLocalDateTime(date, "12:00"),
      };
    }

    return {
      start: buildLocalDateTime(date, "13:00"),
      end: buildLocalDateTime(date, "17:00"),
    };
  }

  async function handleAppointmentBooking() {
    if (selectedDogIds.length === 0) {
      alert("Please select at least one dog");
      return;
    }

    if (shouldRequireOwnerAddress && !effectiveOwnerAddress.trim()) {
      alert("Please add an address for this home-based service");
      return;
    }

    if (isGrooming && (!selectedGroomingCategory || !selectedGroomingSize)) {
      alert("Please select a grooming option and dog size");
      return;
    }

    if (isMobileVet && !mobileVetOffering) {
      alert("Please select a mobile vet service");
      return;
    }

    if (isPetTransport) {
      if (!pickupPoint.trim()) {
        alert("Please enter a pickup point");
        return;
      }

      if (!dropoffPoint.trim()) {
        alert("Please enter a drop-off point");
        return;
      }
    }

    let start: Date | null = null;
    let end: Date | null = null;

    if (isDaycare) {
      if (!date) {
        alert("Please select a date");
        return;
      }

      const daycareWindow = getDaycareWindow();

      if (!daycareWindow) {
        alert("Please select a valid daycare date");
        return;
      }

      start = daycareWindow.start;
      end = daycareWindow.end;
    } else {
      if (!selectedSlot) {
        alert("Please select a time");
        return;
      }

      start = new Date(selectedSlot);
      end = new Date(start.getTime() + appointmentDurationMinutes * 60 * 1000);
    }

    setLoading(true);

    try {
      await api.post("/api/bookings", {
        supplierId,
        supplierServiceId: service.id,
        serviceType,
        startAt: start,
        endAt: end,
        dogIds: selectedDogIds,
        notes: buildAppointmentNotes() || undefined,
        groomingCategory: isGrooming ? selectedGroomingCategory : undefined,
        groomingSize: isGrooming ? selectedGroomingSize : undefined,
        daycareType: isDaycare ? daycareType : undefined,
        halfDayPeriod:
          isDaycare && daycareType === "HALF_DAY" ? halfDayPeriod : undefined,
        mobileVetOffering: isMobileVet ? mobileVetOffering : undefined,
      });

      alert("✅ Booking request sent!");
      onClose();
    } catch (err: any) {
      console.error("APPOINTMENT BOOKING ERROR:", err);
      alert(`❌ ${err?.response?.data?.error || "Booking failed. Please try another time."}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleStayBooking() {
    if (!arrivalDate || !departureDate) {
      alert("Please select arrival and departure dates");
      return;
    }

    if (selectedDogIds.length === 0) {
      alert("Please select at least one dog");
      return;
    }

    if (shouldRequireOwnerAddress && !effectiveOwnerAddress.trim()) {
      alert("Please add an address for this home-based service");
      return;
    }

    setLoading(true);

    try {
      const start = new Date(`${arrivalDate}T09:00:00`);
      const end = new Date(`${departureDate}T09:00:00`);

      await api.post("/api/bookings", {
        supplierId,
        supplierServiceId: service.id,
        serviceType,
        startAt: start,
        endAt: end,
        dogIds: selectedDogIds,
        notes: buildStayNotes() || undefined,
        dogCount: selectedDogIds.length,
        kennelType: isBoarding ? kennelType : undefined,
        petSittingLocation: isPetSitting ? petSittingLocation : undefined,
      });

      alert("✅ Booking request sent!");
      onClose();
    } catch (err: any) {
      console.error("STAY BOOKING ERROR:", err);
      alert(`❌ ${err?.response?.data?.error || "Booking failed. Please try another time."}`);
    } finally {
      setLoading(false);
    }
  }

  const stayBookingDisabled =
    !arrivalDate ||
    !departureDate ||
    loading ||
    dogsLoading ||
    dogs.length === 0 ||
    selectedDogIds.length === 0 ||
    (shouldRequireOwnerAddress && !effectiveOwnerAddress.trim());

  const appointmentBookingDisabled =
    loading ||
    dogsLoading ||
    dogs.length === 0 ||
    selectedDogIds.length === 0 ||
    !date ||
    (usesSlotSelection && !selectedSlot) ||
    (shouldRequireOwnerAddress && !effectiveOwnerAddress.trim()) ||
    (isGrooming && (!selectedGroomingCategory || !selectedGroomingSize)) ||
    (isMobileVet && !mobileVetOffering) ||
    (isPetTransport && (!pickupPoint.trim() || !dropoffPoint.trim()));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-3 py-4 sm:px-4">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-start">
        <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="shrink-0 border-b bg-white px-5 py-4">
            <h2 className="text-xl font-semibold">{title}</h2>

            <div className="mt-1 text-sm text-gray-600">
              {formatPrice(displayPrice)} per{" "}
              {String(service?.unit || "session").toLowerCase().replace(/^per_/, "")}
              {service?.durationMinutes ? ` • ${service.durationMinutes} mins` : ""}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Select dog(s)</label>

              {dogs.map((dog) => {
                const checked = selectedDogIds.includes(dog.id);

                return (
                  <label
                    key={dog.id}
                    className="flex cursor-pointer items-center gap-3 rounded border px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDog(dog.id)}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{dog.name}</span>
                      {dog.breed ? ` • ${dog.breed}` : ""}
                    </span>
                  </label>
                );
              })}
            </div>

            {shouldRequireOwnerAddress ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3">
                <p className="text-sm font-medium text-blue-900">Service address</p>

                {ownerAddress ? (
                  <label className="flex items-start gap-2 text-sm text-blue-800">
                    <input
                      type="checkbox"
                      checked={useSavedAddress}
                      onChange={(e) => setUseSavedAddress(e.target.checked)}
                    />
                    <span className="whitespace-pre-line">
                      Use saved home address: {ownerAddress}
                    </span>
                  </label>
                ) : null}

                {!useSavedAddress || !ownerAddress ? (
                  <textarea
                    className="min-h-[80px] w-full rounded border px-3 py-2 text-sm"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    placeholder="Enter address for this booking"
                  />
                ) : null}
              </div>
            ) : null}

            {isStayService ? (
              <>
                <input type="date" className="w-full rounded border px-3 py-2" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                <input type="date" className="w-full rounded border px-3 py-2" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
              </>
            ) : (
              <>
                <input type="date" className="w-full cursor-pointer rounded-lg border-2 border-blue-300 bg-white px-3 py-3 text-base font-medium text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200" value={date} onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }} />

                {usesSlotSelection && !date ? <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Choose a date to see available times.</p> : usesSlotSelection && slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot, i) => (
                      <button
                        key={i}
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
              </>
            )}

            <textarea
              className="min-h-[100px] w-full rounded border px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the supplier should know"
            />
          </div>

          <div className="shrink-0 border-t bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <button
              onClick={isStayService ? handleStayBooking : handleAppointmentBooking}
              disabled={isStayService ? stayBookingDisabled : appointmentBookingDisabled}
              className="w-full rounded bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>

            <button
              onClick={onClose}
              className="mt-3 w-full py-2 text-center text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}