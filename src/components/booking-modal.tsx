// src/components/booking-modal.tsx
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
  return String(value || "")
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
  const isGrooming = serviceType === "GROOMING";
  const isWalking = serviceType === "WALKING";
  const isTraining = serviceType === "TRAINING";

  const isStayService = isBoarding || isPetSitting;
  const appointmentDurationMinutes = Number(service?.durationMinutes || 60);

  const [ownerAddress, setOwnerAddress] = useState("");
  const [date, setDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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

  const displayPrice =
    isGrooming && selectedGroomingTier?.priceCents
      ? selectedGroomingTier.priceCents
      : service?.baseRateCents;

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
    if (!date || isStayService) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    api
      .get(`/api/suppliers/${supplierId}/availability?date=${date}`)
      .then((res) => setSlots(res.data?.slots || []))
      .catch(() => setSlots([]));
  }, [date, supplierId, isStayService]);

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

    if (notes.trim()) parts.push(notes.trim());

    return parts.join(" ");
  }

  async function handleBooking() {
    if (selectedDogIds.length === 0) return alert("Select at least one dog");

    if (isStayService && (!arrivalDate || !departureDate)) {
      return alert("Select arrival and departure dates");
    }

    if (!isStayService && !date) return alert("Select a date");
    if (!isStayService && !selectedSlot) return alert("Select a time");

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
      const startAt = isStayService
        ? new Date(`${arrivalDate}T09:00`)
        : new Date(selectedSlot!);

      const endAt = isStayService
        ? new Date(`${departureDate}T09:00`)
        : new Date(startAt.getTime() + appointmentDurationMinutes * 60000);

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
      });

      alert("✅ Booking sent");
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error");
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
              {formatPrice(displayPrice)}{" "}
              {service?.unit
                ? `per ${String(service.unit).toLowerCase().replace(/^per_/, "")}`
                : ""}
            </p>
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
                <p className="mt-2 text-xs text-gray-500">
                  You can select one or multiple dogs above.
                </p>
              </div>
            ) : null}

            {shouldRequireOwnerAddress && ownerAddress ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium text-blue-900">Service address</p>
                <p className="mt-1 whitespace-pre-line">{ownerAddress}</p>
              </div>
            ) : null}

            {isGrooming ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="mb-1 text-sm font-medium">Grooming option</p>
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
                        {category === "WASH_BRUSH"
                          ? "Wash & Brush"
                          : category === "WASH_CUT"
                          ? "Wash & Cut"
                          : formatLabel(String(category))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium">Dog size</p>
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
                </div>

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

            {isStayService ? (
              <div className="rounded-lg border-2 border-blue-300 p-3 overflow-hidden">
                <p className="text-sm font-semibold">
                  Select arrival and departure dates
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  Choose when the stay starts and ends.
                </p>

                <div className="space-y-3">
                  <label className="block overflow-hidden">
                    <span className="mb-1 block text-sm font-medium">
                      Arrival date
                    </span>
                    <input
                      type="date"
                      className={dateInputClass}
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                    />
                  </label>

                  <label className="block overflow-hidden">
                    <span className="mb-1 block text-sm font-medium">
                      Departure date
                    </span>
                    <input
                      type="date"
                      className={dateInputClass}
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </label>
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
                <p className="text-sm font-semibold">Select date and time</p>
                <p className="mb-3 text-xs text-gray-500">
                  Choose a date first, then pick an available time slot.
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
              </div>
            )}

            {!isStayService && slots.length > 0 ? (
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
              {loading ? "Booking..." : "Confirm Booking"}
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