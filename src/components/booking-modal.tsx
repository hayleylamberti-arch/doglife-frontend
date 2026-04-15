import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface Props {
  supplierId: string;
  service: any;
  onClose: () => void;
}

type KennelType = "SOCIAL" | "PRIVATE";

interface Dog {
  id: string;
  name: string;
  breed?: string | null;
}

export default function BookingModal({ supplierId, service, onClose }: Props) {
  const serviceType = service?.service || "WALKING";
  const isBoarding = serviceType === "BOARDING";

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [dogCount, setDogCount] = useState(1);
  const [kennelType, setKennelType] = useState<KennelType>("SOCIAL");
  const [notes, setNotes] = useState("");

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [dogsLoading, setDogsLoading] = useState(false);

  const title = useMemo(() => {
    return `Book ${String(serviceType).replace(/_/g, " ")}`;
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
    if (isBoarding) return;

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
  }, [supplierId, date, isBoarding]);

  useEffect(() => {
    if (isBoarding) {
      setDogCount(selectedDogIds.length || 1);
    }
  }, [selectedDogIds, isBoarding]);

  function toggleDog(dogId: string) {
    setSelectedDogIds((prev) =>
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId]
    );
  }

  async function handleAppointmentBooking() {
    if (!selectedSlot) return;

    if (selectedDogIds.length === 0) {
      alert("Please select at least one dog");
      return;
    }

    setLoading(true);

    try {
      const start = new Date(selectedSlot);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      await api.post("/api/bookings", {
        supplierId,
        serviceType,
        startAt: start,
        endAt: end,
        dogIds: selectedDogIds,
        notes: notes || undefined,
      });

      alert("✅ Booking request sent!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Booking failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleBoardingBooking() {
    if (!arrivalDate || !departureDate) return;

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
        serviceType: "BOARDING",
        startAt: start,
        endAt: end,
        dogIds: selectedDogIds,
        notes,
        dogCount: selectedDogIds.length,
        kennelType,
      });

      alert("✅ Boarding request sent!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>

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
                    className="flex items-center gap-3 border rounded px-3 py-2 cursor-pointer"
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

        {isBoarding ? (
          <>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Arrival date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Departure date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Number of dogs</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-3 py-2 bg-gray-50"
                value={selectedDogIds.length || 1}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Kennel type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={kennelType}
                onChange={(e) => setKennelType(e.target.value as KennelType)}
              >
                <option value="SOCIAL">Social kennel</option>
                <option value="PRIVATE">Private kennel</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Notes</label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the supplier should know"
              />
            </div>

            <button
              onClick={handleBoardingBooking}
              disabled={
                !arrivalDate ||
                !departureDate ||
                loading ||
                dogsLoading ||
                dogs.length === 0
              }
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Boarding"}
            </button>
          </>
        ) : (
          <>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
            />

            {slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot, i) => {
                  const time = new Date(slot).toLocaleTimeString("en-ZA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`border rounded p-2 text-sm ${
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
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Notes</label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the supplier should know"
              />
            </div>

            <button
              onClick={handleAppointmentBooking}
              disabled={
                !selectedSlot ||
                loading ||
                dogsLoading ||
                dogs.length === 0
              }
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </>
        )}

        <button onClick={onClose} className="text-sm text-gray-500">
          Cancel
        </button>
      </div>
    </div>
  );
}