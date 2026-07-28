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

        const match = saved.find(
          (item: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
          }) => item.dayOfWeek === backendDayOfWeek
        );

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
      console.error("Failed to load business default availability", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(index: number) {
    setAvailability((current) =>
      current.map((day, dayIndex) =>
        dayIndex === index
          ? {
              ...day,
              enabled: !day.enabled,
            }
          : day
      )
    );
  }

  function updateTime(
    index: number,
    field: "start" | "end",
    value: string
  ) {
    setAvailability((current) =>
      current.map((day, dayIndex) =>
        dayIndex === index
          ? {
              ...day,
              [field]: value,
            }
          : day
      )
    );
  }

  async function saveAvailability() {
    try {
      setSaving(true);

      const formatted = availability
        .map((day, index) => ({
          ...day,
          dayOfWeek: uiIndexToBackendDayOfWeek(index),
        }))
        .filter((day) => day.enabled)
        .map((day) => {
          if (day.start >= day.end) {
            throw new Error(
              `${day.day}: The closing time must be later than the opening time.`
            );
          }

          return {
            dayOfWeek: day.dayOfWeek,
            startTime: day.start,
            endTime: day.end,
          };
        });

      await api.post("/api/supplier/availability", {
        availability: formatted,
      });

      alert("✅ Business default availability saved");

      await fetchAvailability();
    } catch (err: any) {
      alert(err.message || "❌ Failed to save business default availability");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading business default availability...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Business default availability
        </h1>

        <p className="text-gray-600">
          Set the hours your business usually accepts bookings. These hours
          automatically apply to every service unless you give a service its
          own schedule.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
        <p className="font-medium">How this works</p>

        <p className="text-sm text-gray-600">
          Select the days your business is normally open and set your usual
          booking hours.
        </p>

        <p className="text-sm text-gray-600">
          You can override these hours for an individual service on the
          Services page.
        </p>

        <p className="text-sm text-gray-600">
          Use each service&apos;s Unavailable dates section for holidays, leave
          and other once-off closures.
        </p>
      </div>

      <div className="space-y-4">
        {availability.map((day, index) => (
          <div
            key={day.day}
            className="flex flex-wrap items-center gap-4 rounded-lg border p-4"
          >
            <input
              type="checkbox"
              checked={day.enabled}
              onChange={() => toggleDay(index)}
              aria-label={`Accept bookings on ${day.day}`}
              className="h-4 w-4"
            />

            <div className="w-32 font-medium">{day.day}</div>

            <div
              className={`flex items-center gap-3 ${
                day.enabled ? "" : "opacity-50"
              }`}
            >
              <input
                type="time"
                disabled={!day.enabled}
                value={day.start}
                onChange={(event) =>
                  updateTime(index, "start", event.target.value)
                }
                aria-label={`${day.day} opening time`}
                className="rounded border px-2 py-1"
              />

              <span className="text-gray-600">to</span>

              <input
                type="time"
                disabled={!day.enabled}
                value={day.end}
                onChange={(event) =>
                  updateTime(index, "end", event.target.value)
                }
                aria-label={`${day.day} closing time`}
                className="rounded border px-2 py-1"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={saveAvailability}
        disabled={saving}
        className="rounded-md bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save default availability"}
      </button>
    </div>
  );
}