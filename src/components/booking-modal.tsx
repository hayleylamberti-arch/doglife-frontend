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
  const [selectedGroomingSize, setSelectedGroomingSize] =
    useState<string>("");

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

  function buildAppointmentNotes() {
    const extraLines: string[] = [];

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

    if (notes.trim()) {
      extraLines.push(notes.trim());
    }

    return extraLines.join(" ");
  }

  function getDaycareWindow() {
    if (!date) {
      return null;
    }

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

      const message =
        err?.response?.data?.error || "Booking failed. Please try another time.";

      alert(`❌ ${message}`);
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

      const message =
        err?.response?.data?.error || "Booking failed. Please try another time.";

      alert(`❌ ${message}`);
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
    selectedDogIds.length === 0;

  const appointmentBookingDisabled =
    loading ||
    dogsLoading ||
    dogs.length === 0 ||
    selectedDogIds.length === 0 ||
    !date ||
    (usesSlotSelection && !selectedSlot) ||
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
              {isBoarding ? (
                <p>{formatPrice(displayPrice)} per night</p>
              ) : isPetSitting ? (
                <p>{formatPrice(displayPrice)} per stay</p>
              ) : service?.unit ? (
                <p>
                  {formatPrice(displayPrice)} per{" "}
                  {String(service.unit).toLowerCase().replace(/^per_/, "")}
                  {service?.durationMinutes
                    ? ` • ${service.durationMinutes} mins`
                    : ""}
                </p>
              ) : (
                <p>
                  {formatPrice(displayPrice)}
                  {service?.durationMinutes
                    ? ` • ${service.durationMinutes} mins`
                    : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Select dog(s)</label>

              {dogsLoading ? (
                <p className="text-sm text-gray-500">Loading dogs...</p>
              ) : dogs.length === 0 ? (
                <p className="text-sm text-red-500">
                  No dogs found. Please add a dog before making a booking.
                </p>
              ) : (
                <div className="space-y-2">
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
              )}
            </div>

            {isStayService ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Arrival date</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">
                    Departure date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>

                {isBoarding ? (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">
                      Kennel type
                    </label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={kennelType}
                      onChange={(e) =>
                        setKennelType(e.target.value as KennelType)
                      }
                    >
                      <option value="SOCIAL">Social kennel</option>
                      <option value="PRIVATE">Private kennel</option>
                    </select>
                  </div>
                ) : null}

                {isPetSitting ? (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">
                      Stay location
                    </label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={petSittingLocation}
                      onChange={(e) =>
                        setPetSittingLocation(
                          e.target.value as PetSittingLocation
                        )
                      }
                    >
                      <option value="OWNER_HOME">At owner's home</option>
                      <option value="SITTER_HOME">At sitter's home</option>
                    </select>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Notes</label>
                  <textarea
                    className="min-h-[100px] w-full rounded border px-3 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the supplier should know"
                  />
                </div>
              </>
            ) : (
              <>
                {isGrooming && groomingCategories.length > 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">
                        Grooming option
                      </label>
                      <select
                        className="w-full rounded border px-3 py-2"
                        value={selectedGroomingCategory}
                        onChange={(e) => {
                          setSelectedGroomingCategory(e.target.value);
                          setSelectedGroomingSize("");
                        }}
                      >
                        {groomingCategories.map((category) => (
                          <option key={category} value={category}>
                            {category === "WASH_BRUSH"
                              ? "Wash & Brush"
                              : "Wash & Cut"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Dog size</label>
                      <select
                        className="w-full rounded border px-3 py-2"
                        value={selectedGroomingSize}
                        onChange={(e) =>
                          setSelectedGroomingSize(e.target.value)
                        }
                      >
                        {availableSizesForCategory.map((tier: any) => (
                          <option key={tier.id} value={tier.dogSize}>
                            {formatDogSize(tier.dogSize)} —{" "}
                            {formatPrice(tier.priceCents)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                {isDaycare ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">
                        Daycare type
                      </label>
                      <select
                        className="w-full rounded border px-3 py-2"
                        value={daycareType}
                        onChange={(e) =>
                          setDaycareType(e.target.value as DaycareType)
                        }
                      >
                        <option value="FULL_DAY">Full day</option>
                        <option value="HALF_DAY">Half day</option>
                      </select>
                    </div>

                    {daycareType === "HALF_DAY" ? (
                      <div className="space-y-2">
                        <label className="text-sm text-gray-600">
                          Half day period
                        </label>
                        <select
                          className="w-full rounded border px-3 py-2"
                          value={halfDayPeriod}
                          onChange={(e) =>
                            setHalfDayPeriod(e.target.value as HalfDayPeriod)
                          }
                        >
                          <option value="MORNING">Morning</option>
                          <option value="AFTERNOON">Afternoon</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {isMobileVet ? (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">
                      Vet service needed
                    </label>
                    <select
                      className="w-full rounded border px-3 py-2"
                      value={mobileVetOffering}
                      onChange={(e) => setMobileVetOffering(e.target.value)}
                    >
                      {mobileVetOfferingOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {isPetTransport ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">
                        Journey type
                      </label>
                      <select
                        className="w-full rounded border px-3 py-2"
                        value={petTransportJourneyType}
                        onChange={(e) =>
                          setPetTransportJourneyType(
                            e.target.value as PetTransportJourneyType
                          )
                        }
                      >
                        <option value="ONE_WAY">One way</option>
                        <option value="RETURN">Return journey</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">
                        Pickup point
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={pickupPoint}
                        onChange={(e) => setPickupPoint(e.target.value)}
                        placeholder="Enter pickup address or location"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">
                        Drop-off point
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border px-3 py-2"
                        value={dropoffPoint}
                        onChange={(e) => setDropoffPoint(e.target.value)}
                        placeholder="Enter drop-off address or location"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Select date</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                  />
                </div>

                {usesSlotSelection ? (
                  slots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot, i) => {
                        const time = new Date(slot).toLocaleTimeString(
                          "en-ZA",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        );

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded border p-2 text-sm ${
                              selectedSlot === slot
                                ? "bg-blue-600 text-white"
                                : "bg-white"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    date && (
                      <p className="text-sm text-gray-500">
                        No availability for this date
                      </p>
                    )
                  )
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Notes</label>
                  <textarea
                    className="min-h-[100px] w-full rounded border px-3 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the supplier should know"
                  />
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 border-t bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            {isStayService ? (
              <button
                onClick={handleStayBooking}
                disabled={stayBookingDisabled}
                className="w-full rounded bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            ) : (
              <button
                onClick={handleAppointmentBooking}
                disabled={appointmentBookingDisabled}
                className="w-full rounded bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            )}

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