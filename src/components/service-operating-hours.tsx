import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";

type OperatingHour = {
  id?: string;
  serviceId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type SupplierAvailability = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type DaySchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

interface ServiceOperatingHoursProps {
  serviceId: string;
  operatingHours?: OperatingHour[];
}

const DAYS = [
  { dayOfWeek: 0, label: "Sunday" },
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
];

function createEmptySchedule(): Record<number, DaySchedule> {
  return DAYS.reduce((schedule, day) => {
    schedule[day.dayOfWeek] = {
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
    };

    return schedule;
  }, {} as Record<number, DaySchedule>);
}

function buildScheduleFromHours(
  hours: Array<OperatingHour | SupplierAvailability>
): Record<number, DaySchedule> {
  const schedule = createEmptySchedule();

  for (const hour of hours) {
    /*
     * The current supplier UI supports one recurring period per weekday.
     * The backend and database can support multiple periods in future.
     */
    if (!schedule[hour.dayOfWeek]?.enabled) {
      schedule[hour.dayOfWeek] = {
        enabled: true,
        startTime: hour.startTime,
        endTime: hour.endTime,
      };
    }
  }

  return schedule;
}

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to save service availability"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to save service availability";
}

function formatTime(value: string): string {
  return value;
}

export default function ServiceOperatingHours({
  serviceId,
  operatingHours = [],
}: ServiceOperatingHoursProps) {
  const queryClient = useQueryClient();

  const initiallyUsesSupplierDefault = operatingHours.length === 0;

  const [isEditing, setIsEditing] = useState(false);
  const [usesSupplierDefault, setUsesSupplierDefault] = useState(
    initiallyUsesSupplierDefault
  );

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(
    buildScheduleFromHours(operatingHours)
  );

  const { data: supplierAvailabilityData } = useQuery({
    queryKey: ["supplier-default-availability"],
    queryFn: async () => {
      const response = await api.get("/api/supplier/availability");

      return (
        response.data.availability as SupplierAvailability[]
      ).filter((hour) => hour.isActive);
    },
  });

  const supplierDefaultHours = supplierAvailabilityData ?? [];

  useEffect(() => {
    const currentlyUsesDefault = operatingHours.length === 0;

    setUsesSupplierDefault(currentlyUsesDefault);

    if (!isEditing) {
      setSchedule(buildScheduleFromHours(operatingHours));
    }
  }, [operatingHours, isEditing]);

  const sortedOperatingHours = useMemo(
    () =>
      [...operatingHours].sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek ||
          a.startTime.localeCompare(b.startTime)
      ),
    [operatingHours]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const hours = DAYS.filter(
        (day) => schedule[day.dayOfWeek]?.enabled
      ).map((day) => {
        const daySchedule = schedule[day.dayOfWeek];

        if (!daySchedule.startTime || !daySchedule.endTime) {
          throw new Error(
            `Choose both a start and end time for ${day.label}.`
          );
        }

        if (daySchedule.startTime >= daySchedule.endTime) {
          throw new Error(
            `${day.label}'s end time must be later than its start time.`
          );
        }

        return {
          dayOfWeek: day.dayOfWeek,
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
        };
      });

      if (hours.length === 0) {
        throw new Error(
          "Select at least one available day, or use your business default availability."
        );
      }

      return api.put(
        `/api/supplierServices/${serviceId}/operating-hours`,
        {
          operatingHours: hours,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-services"],
      });

      setUsesSupplierDefault(false);
      setIsEditing(false);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () =>
      api.delete(
        `/api/supplierServices/${serviceId}/operating-hours`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-services"],
      });

      setUsesSupplierDefault(true);
      setSchedule(createEmptySchedule());
      setIsEditing(false);
    },
  });

  const startCustomSchedule = () => {
    const startingHours =
      operatingHours.length > 0
        ? operatingHours
        : supplierDefaultHours;

    setSchedule(buildScheduleFromHours(startingHours));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setSchedule(buildScheduleFromHours(operatingHours));
    setIsEditing(false);
  };

  const updateDay = (
    dayOfWeek: number,
    changes: Partial<DaySchedule>
  ) => {
    setSchedule((current) => ({
      ...current,
      [dayOfWeek]: {
        ...current[dayOfWeek],
        ...changes,
      },
    }));
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-4">
      <div className="space-y-1">
        <p className="font-medium text-gray-800">
          Service availability
        </p>

        <p className="text-sm text-gray-600">
          This service can use your business default availability, or you can
          give it its own weekly schedule.
        </p>
      </div>

      {!isEditing ? (
        <>
          {usesSupplierDefault ? (
            <div className="rounded-lg border bg-blue-50 p-3">
              <p className="font-medium text-blue-900">
                Using business default availability
              </p>

              <p className="mt-1 text-sm text-blue-800">
                Changes made on the Availability page will automatically apply
                to this service.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                This service overrides your business default availability:
              </p>

              {DAYS.map((day) => {
                const dayHours = sortedOperatingHours.filter(
                  (hour) => hour.dayOfWeek === day.dayOfWeek
                );

                return (
                  <div
                    key={day.dayOfWeek}
                    className="flex items-center justify-between gap-4 rounded border bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-700">
                      {day.label}
                    </span>

                    <span className="text-gray-600">
                      {dayHours.length
                        ? dayHours
                            .map(
                              (hour) =>
                                `${formatTime(
                                  hour.startTime
                                )} – ${formatTime(hour.endTime)}`
                            )
                            .join(", ")
                        : "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startCustomSchedule}
              className="rounded bg-black px-4 py-2 text-sm text-white"
            >
              {usesSupplierDefault
                ? "Set service availability"
                : "Edit service availability"}
            </button>

            {!usesSupplierDefault ? (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Use your business default availability for this service?"
                  );

                  if (confirmed) {
                    resetMutation.mutate();
                  }
                }}
                disabled={resetMutation.isPending}
                className="rounded border px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                {resetMutation.isPending
                  ? "Resetting..."
                  : "Use business default"}
              </button>
            ) : null}
          </div>

          {resetMutation.isError ? (
            <p className="text-sm text-red-600">
              {getApiErrorMessage(resetMutation.error)}
            </p>
          ) : null}
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-amber-50 p-3 text-sm text-amber-900">
            Unticked days will be unavailable for this service.
          </div>

          <div className="space-y-3">
            {DAYS.map((day) => {
              const daySchedule = schedule[day.dayOfWeek];

              return (
                <div
                  key={day.dayOfWeek}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[140px_1fr]"
                >
                  <label className="flex items-center gap-2 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={daySchedule.enabled}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, {
                          enabled: event.target.checked,
                        })
                      }
                    />

                    {day.label}
                  </label>

                  {daySchedule.enabled ? (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-gray-600">
                          Opens
                        </span>

                        <input
                          type="time"
                          value={daySchedule.startTime}
                          onChange={(event) =>
                            updateDay(day.dayOfWeek, {
                              startTime: event.target.value,
                            })
                          }
                          className="block w-full rounded border px-3 py-2"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-gray-600">
                          Closes
                        </span>

                        <input
                          type="time"
                          value={daySchedule.endTime}
                          onChange={(event) =>
                            updateDay(day.dayOfWeek, {
                              endTime: event.target.value,
                            })
                          }
                          className="block w-full rounded border px-3 py-2"
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="self-center text-sm text-gray-500">
                      Closed
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-500">
            This schedule applies only to this service. Add holidays, leave and
            other once-off closures under Unavailable dates.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saveMutation.isPending
                ? "Saving..."
                : "Save service availability"}
            </button>

            <button
              type="button"
              onClick={cancelEditing}
              disabled={saveMutation.isPending}
              className="rounded border px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {saveMutation.isError ? (
            <p className="text-sm text-red-600">
              {getApiErrorMessage(saveMutation.error)}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}