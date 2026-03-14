import { useState } from "react";
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

export default function SupplierAvailability() {

  const [availability, setAvailability] = useState(
    DAYS.map(day => ({
      day,
      enabled: false,
      start: "09:00",
      end: "17:00"
    }))
  );

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

  async function saveAvailability() {

    await api.post("/api/supplier/availability", {
      availability
    });

    alert("Availability saved");
  }

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
        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
      >
        Save Availability
      </button>

    </div>

  );

}