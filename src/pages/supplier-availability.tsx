import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type DayAvailability = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

function uiIndexToBackendDayOfWeek(index: number): number {
  // Backend uses JS Date.getDay():
  // Sunday=0, Monday=1, Tuesday=2, ... Saturday=6
  return index === 6 ? 0 : index + 1;
}

function backendDayOfWeekToUiIndex(dayOfWeek: number): number {
  // Convert backend JS weekday numbering back to UI order:
  // Monday first, Sunday last
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

export default function SupplierAvailability() {
  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS.map((day) => ({
      day,
      enabled: false,
      start: "09:00",
      end: "17:00",
    }))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    try {
      const res = await api.get("/api/supplier/availability");
      const saved = res.data?.availability || [];

      const mapped = DAYS.map((day, index) => {
        const backendDayOfWeek = uiIndexToBackendDayOfWeek(index);

        const match = saved.find((s: any) => {
          return s.dayOfWeek === backendDayOfWeek;
        });

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
    } finally {
      setLoading(false);
    }
  }

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
    try {
      setSaving(true);

      const formatted = availability
        .filter((day) => day.enabled)
        .map((day, index) => {
          if (day.start >= day.end) {
            throw new Error(`${day.day}: End time must be after start time`);
          }

          const uiIndex = availability.findIndex((item) => item.day === day.day);

          return {
            dayOfWeek: uiIndexToBackendDayOfWeek(uiIndex),
            startTime: day.start,
            endTime: day.end,
          };
        });

      await api.post("/api/supplier/availability", {
        availability: formatted,
      });

      alert("✅ Availability saved");

      fetchAvailability();
    } catch (err: any) {
      alert(err.message || "❌ Failed to save availability");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading availability...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Manage Availability</h1>

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

            <div className="w-32 font-medium">{day.day}</div>

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
        disabled={saving}
        className="bg-black text-white px-6 py-3 rounded-md"
      >
        {saving ? "Saving..." : "Save Availability"}
      </button>
    </div>
  );
}