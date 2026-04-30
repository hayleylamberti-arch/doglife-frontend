import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface Props {
  supplierId: string;
  service: any;
  onClose: () => void;
}

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

function formatLabel(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function BookingModal({ supplierId, service, onClose }: Props) {
  const serviceType = service?.service || "WALKING";

  const isBoarding = serviceType === "BOARDING";
  const isPetSitting = serviceType === "PET_SITTING";
  const isMobileVet = serviceType === "MOBILE_VET";
  const isPetTransport = serviceType === "PET_TRANSPORT";
  const isWalking = serviceType === "WALKING";
  const isTraining = serviceType === "TRAINING";
  const isGrooming = serviceType === "GROOMING";

  const isStayService = isBoarding || isPetSitting;
  const durationMinutes = Number(service?.durationMinutes || 60);

  const [date, setDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const [ownerAddress, setOwnerAddress] = useState("");
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [bookingAddress, setBookingAddress] = useState("");

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [petSittingLocation, setPetSittingLocation] =
    useState<PetSittingLocation>("OWNER_HOME");

  const [journeyType, setJourneyType] =
    useState<PetTransportJourneyType>("ONE_WAY");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const mobileOptions: string[] = Array.isArray(service?.pricingJson?.offerings)
    ? service.pricingJson.offerings
    : ["CHECK_UP", "INOCULATIONS", "FOLLOW_UP", "OTHER"];

  const [mobileVetService, setMobileVetService] = useState(
    mobileOptions[0] || "CHECK_UP"
  );

  const shouldUseOwnerAddress =
    isWalking ||
    isTraining ||
    isMobileVet ||
    (isPetSitting && petSittingLocation === "OWNER_HOME");

  const serviceAddress = useSavedAddress ? ownerAddress : bookingAddress;

  const unitLabel = String(service?.unit || "session")
    .toLowerCase()
    .replace(/^per_/, "");

  useEffect(() => {
    async function fetchOwnerProfile() {
      try {
        const res = await api.get("/api/owner/profile");
        const address = res.data?.profile?.address || "";

        setOwnerAddress(address);

        if (isPetTransport && address && !pickup) {
          setPickup(address);
        }
      } catch (err) {
        console.error("Failed to load owner profile", err);
      }
    }

    fetchOwnerProfile();
  }, [isPetTransport, pickup]);

  useEffect(() => {
    async function fetchDogs() {
      try {
        const res = await api.get("/api/owner/dogs");
        setDogs(res.data?.dogs || []);
      } catch (err) {
        console.error("Failed to load dogs", err);
        setDogs([]);
      }
    }

    fetchDogs();
  }, []);

  useEffect(() => {
    if (!date || isStayService) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    async function fetchSlots() {
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

    fetchSlots();
  }, [date, supplierId, isStayService]);

  const canConfirm = useMemo(() => {
    if (loading || selectedDogIds.length === 0) return false;

    if (shouldUseOwnerAddress && !serviceAddress.trim()) return false;

    if (isStayService) {
      return Boolean(arrivalDate && departureDate);
    }

    if (isPetTransport) {
      return Boolean(date && selectedSlot && pickup.trim() && dropoff.trim());
    }

    return Boolean(date && selectedSlot);
  }, [
    loading,
    selectedDogIds,
    shouldUseOwnerAddress,
    serviceAddress,
    isStayService,
    arrivalDate,
    departureDate,
    isPetTransport,
    date,
    selectedSlot,
    pickup,
    dropoff,
  ]);

  function toggleDog(id: string) {
    setSelectedDogIds((prev) =>
      prev.includes(id) ? prev.filter((dogId) => dogId !== id) : [...prev, id]
    );
  }

  function buildNotes() {
    const parts: string[] = [];

    if (shouldUseOwnerAddress) {
      parts.push("Service location: OWNER_HOME.");
      parts.push(`Owner address: ${serviceAddress.trim()}.`);
    }

    if (isTraining) {
      parts.push("Training location: owner home.");
    }

    if (isPetSitting) {
      parts.push(`Pet sitting location: ${petSittingLocation}.`);
    }

    if (isPetTransport) {
      parts.push(`Journey type: ${formatLabel(journeyType)}.`);
      parts.push(`Pickup point: ${pickup.trim()}.`);
      parts.push(`Drop-off point: ${dropoff.trim()}.`);
    }

    if (isMobileVet) {
      parts.push(`Mobile vet service: ${mobileVetService}.`);
    }

    if (isGrooming && shouldUseOwnerAddress) {
      parts.push("Mobile grooming.");
    }

    if (notes.trim()) {
      parts.push(notes.trim());
    }

    return parts.join(" ");
  }

  async function handleBooking() {
    if (selectedDogIds.length === 0) {
      alert("Please select at least one dog");
      return;
    }

    if (shouldUseOwnerAddress && !serviceAddress.trim()) {
      alert("Please add an address for this home-based service");
      return;
    }

    if (isStayService && (!arrivalDate || !departureDate)) {
      alert("Please select arrival and departure dates");
      return;
    }

    if (!isStayService && (!date || !selectedSlot)) {
      alert("Please select date and time");
      return;
    }

    if (isPetTransport && (!pickup.trim() || !dropoff.trim())) {
      alert("Please add pickup and drop-off locations");
      return;
    }

    setLoading(true);

    try {
      const startAt = isStayService
        ? new Date(`${arrivalDate}T09:00:00`)
        : new Date(selectedSlot!);

      const endAt = isStayService
        ? new Date(`${departureDate}T09:00:00`)
        : new Date(startAt.getTime() + durationMinutes * 60 * 1000);

      await api.post("/api/bookings", {
        supplierId,
        supplierServiceId: service.id,
        serviceType,
        startAt,
        endAt,
        dogIds: selectedDogIds,
        notes: buildNotes() || undefined,
        dogCount: selectedDogIds.length,
        petSittingLocation: isPetSitting ? petSittingLocation : undefined,
        mobileVetOffering: isMobileVet ? mobileVetService : undefined,
      });

      alert("✅ Booking request sent");
      onClose();
    } catch (error: any) {
      alert(error?.response?.data?.error || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-3 py-4">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg items-start">
        <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="shrink-0 border-b bg-white px-5 py-4">
            <h2 className="text-xl font-semibold">
              Book {formatServiceName(serviceType)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatPrice(service?.baseRateCents)} per {unitLabel}
              {service?.durationMinutes ? ` • ${service.durationMinutes} mins` : ""}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select dog(s)</p>

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
                  <span className="text-sm">
                    {dog.name}
                    {dog.breed ? ` • ${dog.breed}` : ""}
                  </span>
                </label>
              ))}
            </div>

            {shouldUseOwnerAddress ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3">
                <p className="text-sm font-semibold text-blue-900">
                  Service address
                </p>

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

            {isPetSitting ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">
                  Pet sitting location
                </p>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={petSittingLocation}
                  onChange={(e) =>
                    setPetSittingLocation(e.target.value as PetSittingLocation)
                  }
                >
                  <option value="OWNER_HOME">At owner home</option>
                  <option value="SITTER_HOME">At sitter home</option>
                </select>
              </div>
            ) : null}

            {isStayService ? (
              <div className="rounded-lg border-2 border-blue-300 bg-white p-3 shadow-sm space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Select arrival and departure dates
                  </p>
                  <p className="text-xs text-gray-500">
                    Choose when the stay starts and ends.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Arrival date
                  </label>
                  <input
                    type="date"
                    className="block w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Departure date
                  </label>
                  <input
                    type="date"
                    className="block w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border-2 border-blue-300 bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">
                    Select date and time
                  </p>
                  <p className="mb-3 text-xs text-gray-500">
                    Choose a date first, then pick an available time slot.
                  </p>

                  <input
                    type="date"
                    className="block w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                  />
                </div>

                {!date ? (
                  <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    Choose a date to see available times.
                  </p>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded border p-2 text-sm ${
                          selectedSlot === slot
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        {new Date(slot).toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    No availability for this date.
                  </p>
                )}
              </>
            )}

            {isPetTransport ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Journey type
                  </p>
                  <select
                    className="mt-2 w-full rounded border px-3 py-2"
                    value={journeyType}
                    onChange={(e) =>
                      setJourneyType(e.target.value as PetTransportJourneyType)
                    }
                  >
                    <option value="ONE_WAY">One way</option>
                    <option value="RETURN">Return</option>
                  </select>
                </div>

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
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">
                  Mobile vet service
                </p>
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
              </div>
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
              disabled={!canConfirm}
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