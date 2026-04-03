import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

type DayAvailability = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

export default function SupplierAvailability() {

  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS.map(day => ({
      day,
      enabled: false,
      start: "09:00",
      end: "17:00"
    }))
  );

  /* -------------------------------------------------- */
  /* 🧠 LOAD EXISTING AVAILABILITY                      */
  /* -------------------------------------------------- */
  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    try {
      const res = await api.get("/api/supplier/availability");

      const saved = res.data?.availability || [];

      // Map backend → frontend
      const mapped = DAYS.map((day, index) => {
        const match = saved.find((s: any) => s.dayOfWeek === index);

        if (match) {
          return {
            day,
            enabled: true,
            start: match.startTime,
            end: match.endTime,
          };
        }

        return {
          day,
          enabled: false,
          start: "09:00",
          end: "17:00",
        };
      });

      setAvailability(mapped);

    } catch (err) {
      console.error("Failed to load availability", err);
    }
  }

  /* -------------------------------------------------- */
  /* 🔄 UI HANDLERS                                     */
  /* -------------------------------------------------- */
  function toggleDay(index: number) {
    const updated = [...availability];
    updated[index].enabled = !updated[index].enabled;
    setAvailability(updated);
  }

  function updateTime(index: number, field: "start" | "end", value: string) {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  }

  /* -------------------------------------------------- */
  /* 💾 SAVE AVAILABILITY                               */
  /* -------------------------------------------------- */
  async function saveAvailability() {
    try {
      const formatted = availability
        .filter(day => day.enabled)
        .map(day => ({
          dayOfWeek: DAYS.indexOf(day.day),
          startTime: day.start,
          endTime: day.end,
        }));

      console.log("SENDING:", formatted);

      await api.post("/api/supplier/availability", {
        availability: formatted,
      });

      alert("✅ Availability saved");

      // 🔥 refresh from backend (ensures sync)
      fetchAvailability();

    } catch (err) {
      console.error(err);
      alert("❌ Failed to save availability");
    }
  }

  /* -------------------------------------------------- */
  /* UI                                                 */
  /* -------------------------------------------------- */
  return (

    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Manage Availability
      </h1>

      <div className="space-y-4">

        {availability.map((day, i) => (

          <div
            key={day.day}
            className="flex items-center gap-4 border rounded-lg p-4"
          >

            <input
              type="checkbox"
              checked={day.enabled}
              onChange={() => toggleDay(i)}
            />

            <div className="w-32 font-medium">
              {day.day}
            </div>

            <input
              type="time"
              disabled={!day.enabled}
              value={day.start}
              onChange={(e) => updateTime(i, "start", e.target.value)}
              className="border rounded px-2 py-1"
            />

            <span>to</span>

            <input
              type="time"
              disabled={!day.enabled}
              value={day.end}
              onChange={(e) => updateTime(i, "end", e.target.value)}
              className="border rounded px-2 py-1"
            />

          </div>

        ))}

      </div>

      <button
        onClick={saveAvailability}
        className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
      >
        Save Availability
      </button>

    </div>
  );
}