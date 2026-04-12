import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Props {
  supplierId: string;
  service: any;
  onClose: () => void;
}

export default function BookingModal({ supplierId, service, onClose }: Props) {

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH AVAILABILITY (NEW ✅)
  ========================= */

  useEffect(() => {
    if (!date) return;

    async function fetchAvailability() {
      try {
        const res = await api.get(
          `/api/suppliers/${supplierId}/availability?date=${date}`
        );

        setSlots(res.data.slots || []);
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    }

    fetchAvailability();
  }, [supplierId, date]);

  /* =========================
     SUBMIT
  ========================= */

  async function handleBooking() {
    if (!selectedSlot) return;

    setLoading(true);

    try {
      const start = new Date(selectedSlot);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      await api.post("/api/bookings", {
        supplierId,
        serviceType: service.service,
        startAt: start,
        endAt: end,
      });

      alert("✅ Booking confirmed!");
      onClose();

    } catch (err) {
      console.error(err);
      alert("❌ Booking failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">

        <h2 className="text-xl font-semibold">
          Book {service?.service?.replace("_", " ")}
        </h2>

        {/* =========================
           DATE PICKER (NEW ✅)
        ========================= */}
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedSlot(null); // reset slot when date changes
          }}
        />

        {/* =========================
           TIME SLOTS (FROM BACKEND ✅)
        ========================= */}
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

        {/* =========================
           ACTION
        ========================= */}
        <button
          onClick={handleBooking}
          disabled={!selectedSlot || loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>

        <button
          onClick={onClose}
          className="text-sm text-gray-500"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}