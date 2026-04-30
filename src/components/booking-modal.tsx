// FULL FILE — SAFE FOR PRODUCTION

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

export default function BookingModal({ supplierId, service, onClose }: Props) {
  const serviceType = service?.service || "WALKING";

  const isBoarding = serviceType === "BOARDING";
  const isPetSitting = serviceType === "PET_SITTING";
  const isMobileVet = serviceType === "MOBILE_VET";
  const isPetTransport = serviceType === "PET_TRANSPORT";

  const isStayService = isBoarding || isPetSitting;

  const [date, setDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // PET SITTING
  const [petSittingLocation, setPetSittingLocation] =
    useState<PetSittingLocation>("OWNER_HOME");

  // TRANSPORT
  const [journeyType, setJourneyType] =
    useState<PetTransportJourneyType>("ONE_WAY");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  // MOBILE VET
  const mobileOptions = service?.pricingJson?.offerings || [
    "CHECK_UP",
    "INOCULATIONS",
    "FOLLOW_UP",
  ];
  const [mobileVetService, setMobileVetService] = useState(mobileOptions[0]);

  useEffect(() => {
    api.get("/api/owner/dogs").then((res) => {
      setDogs(res.data?.dogs || []);
    });
  }, []);

  useEffect(() => {
    if (!date) return;

    api
      .get(`/api/suppliers/${supplierId}/availability?date=${date}`)
      .then((res) => setSlots(res.data?.slots || []));
  }, [date]);

  function toggleDog(id: string) {
    setSelectedDogIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleBooking() {
    if (selectedDogIds.length === 0) return alert("Select a dog");

    setLoading(true);

    try {
      await api.post("/api/bookings", {
        supplierId,
        supplierServiceId: service.id,
        serviceType,
        startAt: isStayService
          ? new Date(`${arrivalDate}T09:00`)
          : new Date(selectedSlot!),
        endAt: isStayService
          ? new Date(`${departureDate}T09:00`)
          : new Date(new Date(selectedSlot!).getTime() + 60 * 60000),
        dogIds: selectedDogIds,
        notes,
        petSittingLocation: isPetSitting ? petSittingLocation : undefined,
        mobileVetOffering: isMobileVet ? mobileVetService : undefined,
      });

      alert("✅ Booking sent");
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <div className="mx-auto max-w-md rounded-xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">
            Book {formatServiceName(serviceType)}
          </h2>
          <p className="text-sm text-gray-500">
            {formatPrice(service?.baseRateCents)}
          </p>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* DOGS */}
          <div>
            <p className="text-sm mb-2">Select dog(s)</p>
            {dogs.map((dog) => (
              <label key={dog.id} className="flex gap-2 border p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedDogIds.includes(dog.id)}
                  onChange={() => toggleDog(dog.id)}
                />
                {dog.name}
              </label>
            ))}
          </div>

          {/* STAY SERVICES */}
          {isStayService ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Arrival date</p>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Departure date</p>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              {isPetSitting && (
                <div>
                  <p className="text-sm font-semibold">Location</p>
                  <select
                    className="w-full border rounded px-3 py-2"
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
              )}
            </>
          ) : (
            <>
              {/* DATE + TIME */}
              <div className="border-2 border-blue-300 rounded-lg p-3">
                <p className="font-semibold text-sm">
                  Select date and time
                </p>
                <input
                  type="date"
                  className="w-full mt-2 border rounded px-3 py-2"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`border rounded p-2 ${
                        selectedSlot === slot
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {new Date(slot).toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TRANSPORT */}
          {isPetTransport && (
            <>
              <select
                className="w-full border rounded px-3 py-2"
                value={journeyType}
                onChange={(e) =>
                  setJourneyType(e.target.value as PetTransportJourneyType)
                }
              >
                <option value="ONE_WAY">One way</option>
                <option value="RETURN">Return</option>
              </select>

              <input
                placeholder="Pickup location"
                className="w-full border rounded px-3 py-2"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />

              <input
                placeholder="Drop-off location"
                className="w-full border rounded px-3 py-2"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
              />
            </>
          )}

          {/* MOBILE VET */}
          {isMobileVet && (
            <select
              className="w-full border rounded px-3 py-2"
              value={mobileVetService}
              onChange={(e) => setMobileVetService(e.target.value)}
            >
              {mobileOptions.map((o: string) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}

          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Anything the supplier should know"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2 text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}