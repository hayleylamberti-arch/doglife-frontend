import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  supplierId: string;
  onClose: () => void;
}

export default function BookingModal({ supplierId, onClose }: Props) {

  const [serviceType, setServiceType] = useState("WALKING");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();
    setLoading(true);

    try {

      const start = new Date(date);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      await api.post("/api/bookings", {
        supplierId,
        serviceType,
        startAt: start,
        endAt: end,
        notes
      });

      alert("Booking request sent!");
      onClose();

    } catch (err) {

      console.error(err);
      alert("Failed to create booking");

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-full max-w-md">

        <h2 className="text-xl font-semibold mb-4">
          Book Service
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <select
            className="w-full border rounded px-3 py-2"
            value={serviceType}
            onChange={(e)=>setServiceType(e.target.value)}
          >
            <option value="WALKING">Dog Walking</option>
            <option value="GROOMING">Grooming</option>
            <option value="BOARDING">Boarding</option>
            <option value="TRAINING">Training</option>
          </select>

          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
            required
          />

          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Notes for the provider"
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            {loading ? "Sending..." : "Send Booking Request"}
          </button>

        </form>

        <button
          onClick={onClose}
          className="mt-3 text-sm text-gray-500"
        >
          Cancel
        </button>

      </div>

    </div>

  );

}