import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

type SupplierService = {
  id: string;
  supplierId: string;
  service: string;
  bookingModel?: string | null;
  trainingBookingMode?: string | null;
  isActive?: boolean | null;
  maxDogsPerBooking?: number | null;
  concurrentCapacityDogs?: number | null;
};

type BookingSlotOption = {
  id?: string;
  startTime: string;
  endTime?: string;
};

const SERVICE_LABELS: Record<string, string> = {
  WALKING: "Dog Walking",
  GROOMING: "Grooming",
  TRAINING: "Training",
  PET_TRANSPORT: "Pet Transport",
  MOBILE_VET: "Mobile Vet",
};

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function effectiveBookingModel(service: SupplierService) {
  if (service.bookingModel) return service.bookingModel;

  if (
    service.service === "BOARDING" ||
    service.service === "PET_SITTING"
  ) {
    return "DATE_RANGE_CAPACITY";
  }

  if (service.service === "DAYCARE") {
    return "BLOCK_CAPACITY";
  }

  if (
    service.service === "TRAINING" &&
    service.trainingBookingMode === "SESSION_EVENT"
  ) {
    return "SESSION_EVENT";
  }

  return "APPOINTMENT";
}

function normalizeSlot(slot: any): BookingSlotOption | null {
  if (typeof slot === "string") {
    return { startTime: slot };
  }

  if (slot?.startTime) {
    return {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  }

  return null;
}

function flattenBookableSlots(payload: any): BookingSlotOption[] {
  const groupedSlots = payload?.slots || {};

  const slots = [
    ...(groupedSlots.morning || []),
    ...(groupedSlots.afternoon || []),
    ...(groupedSlots.evening || []),
  ]
    .map((slot) =>
      normalizeSlot(slot?.start || slot?.startTime || slot),
    )
    .filter(Boolean) as BookingSlotOption[];

  return Array.from(
    new Map(slots.map((slot) => [slot.startTime, slot])).values(),
  );
}

function formatServiceName(service: string) {
  return (
    SERVICE_LABELS[service] ||
    service
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function formatSlotTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatExpiry(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function SendSlotCard() {
  const today = useMemo(() => localDateValue(new Date()), []);

  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<SupplierService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [date, setDate] = useState(today);
  const [dogCount, setDogCount] = useState(1);
  const [slots, setSlots] = useState<BookingSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creating, setCreating] = useState(false);

  const [serviceError, setServiceError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [shareUrl, setShareUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const appointmentServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.isActive !== false &&
          effectiveBookingModel(service) === "APPOINTMENT",
      ),
    [services],
  );

  const selectedService = useMemo(
    () =>
      appointmentServices.find(
        (service) => service.id === selectedServiceId,
      ) || null,
    [appointmentServices, selectedServiceId],
  );

  const maximumDogCount = useMemo(() => {
    if (!selectedService) return 1;

    const configuredLimits = [
      selectedService.maxDogsPerBooking,
      selectedService.concurrentCapacityDogs,
    ].filter(
      (value): value is number =>
        typeof value === "number" && value > 0,
    );

    if (configuredLimits.length === 0) return 10;

    return Math.max(1, Math.min(...configuredLimits));
  }, [selectedService]);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      setLoadingServices(true);
      setServiceError(null);

      try {
        const response = await api.get("/api/supplierServices");
        const nextServices = Array.isArray(response.data?.services)
          ? response.data.services
          : [];

        if (!cancelled) {
          setServices(nextServices);
        }
      } catch (error) {
        if (!cancelled) {
          setServiceError(
            getErrorMessage(
              error,
              "Your services could not be loaded.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const selectionStillExists = appointmentServices.some(
      (service) => service.id === selectedServiceId,
    );

    if (!selectionStillExists) {
      setSelectedServiceId(appointmentServices[0]?.id || "");
    }
  }, [appointmentServices, selectedServiceId]);

  useEffect(() => {
    if (dogCount > maximumDogCount) {
      setDogCount(maximumDogCount);
    }
  }, [dogCount, maximumDogCount]);

  useEffect(() => {
    let cancelled = false;

    setShareUrl("");
    setExpiresAt("");
    setCopyMessage("");
    setSelectedSlot("");
    setActionError(null);

    if (!selectedService || !date) {
      setSlots([]);
      setSlotError(null);
      return;
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setSlotError(null);

      try {
        const supplierId = encodeURIComponent(
          selectedService!.supplierId,
        );
        const serviceId = encodeURIComponent(selectedService!.id);
        const selectedDate = encodeURIComponent(date);

        const response = await api.get(
          `/api/suppliers/${supplierId}/services/${serviceId}/bookable-slots?date=${selectedDate}&dogCount=${dogCount}&limit=50`,
        );

        if (!cancelled) {
          setSlots(flattenBookableSlots(response.data));
        }
      } catch (error) {
        if (!cancelled) {
          setSlots([]);
          setSlotError(
            getErrorMessage(
              error,
              "Available times could not be loaded.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [date, dogCount, selectedService]);

  async function createShareableSlot() {
    if (!selectedService || !selectedSlot) return;

    const startAt = new Date(selectedSlot);

    if (Number.isNaN(startAt.getTime())) {
      setActionError("Please choose a valid time.");
      return;
    }

    setCreating(true);
    setActionError(null);
    setCopyMessage("");

    try {
      const payload: Record<string, unknown> = {
        supplierServiceId: selectedService.id,
        requestedDogCount: dogCount,
        startAt: startAt.toISOString(),
      };

      if (selectedService.service === "PET_TRANSPORT") {
        payload.journeyType = "ONE_WAY";
      }

      const response = await api.post("/api/booking-holds", payload);
      const token = response.data?.token;

      if (!token) {
        throw new Error("The booking link was not returned.");
      }

      setShareUrl(
        `${window.location.origin}/booking-hold/${encodeURIComponent(
          token,
        )}`,
      );
      setExpiresAt(response.data?.hold?.expiresAt || "");
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "The booking link could not be created.",
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage("Link copied.");
      setActionError(null);
    } catch {
      setCopyMessage("");
      setActionError(
        "The link could not be copied automatically. Press and hold the link to copy it.",
      );
    }
  }

  async function shareLink() {
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Your DogLife booking slot",
          text: "Here is the DogLife slot we discussed. Open the link to review and complete your booking.",
          url: shareUrl,
        });
        return;
      } catch (error: any) {
        if (error?.name === "AbortError") return;
      }
    }

    await copyLink();
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Send a Slot
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose an available appointment and create a secure link
            for your client.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {isOpen ? "Close" : "Choose a slot"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 border-t border-gray-200 pt-5">
          {loadingServices ? (
            <p className="text-sm text-gray-600">
              Loading your services…
            </p>
          ) : serviceError ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {serviceError}
            </p>
          ) : appointmentServices.length === 0 ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              No active appointment services are currently available
              for Send a Slot.
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Service
                  </span>
                  <select
                    value={selectedServiceId}
                    onChange={(event) =>
                      setSelectedServiceId(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {appointmentServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {formatServiceName(service.service)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Date
                  </span>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Number of dogs
                  </span>
                  <select
                    value={dogCount}
                    onChange={(event) =>
                      setDogCount(Number(event.target.value))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {Array.from(
                      { length: maximumDogCount },
                      (_, index) => index + 1,
                    ).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Available times
                </h3>

                {loadingSlots ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Checking availability…
                  </p>
                ) : slotError ? (
                  <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {slotError}
                  </p>
                ) : slots.length === 0 ? (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    No available appointment times were found for this
                    date.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slots.map((slot) => {
                      const selected =
                        selectedSlot === slot.startTime;

                      return (
                        <button
                          key={slot.id || slot.startTime}
                          type="button"
                          onClick={() =>
                            setSelectedSlot(slot.startTime)
                          }
                          className={
                            selected
                              ? "rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                              : "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400"
                          }
                        >
                          {formatSlotTime(slot.startTime)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!shareUrl && (
                <div className="mt-5">
                  <button
                    type="button"
                    disabled={!selectedSlot || creating}
                    onClick={createShareableSlot}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {creating
                      ? "Creating secure link…"
                      : "Create booking link"}
                  </button>
                </div>
              )}

              {actionError && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {actionError}
                </p>
              )}

              {shareUrl && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900">
                    Your booking link is ready
                  </h3>
                  <p className="mt-1 text-sm text-green-800">
                    Send this link to your client. They must sign in,
                    choose their dog and confirm the booking.
                  </p>

                  {expiresAt && (
                    <p className="mt-1 text-xs text-green-700">
                      This link expires on {formatExpiry(expiresAt)}.
                    </p>
                  )}

                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-3 w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={shareLink}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Share link
                    </button>

                    <button
                      type="button"
                      onClick={copyLink}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Copy link
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShareUrl("");
                        setExpiresAt("");
                        setCopyMessage("");
                        setSelectedSlot("");
                      }}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white"
                    >
                      Create another
                    </button>
                  </div>

                  {copyMessage && (
                    <p className="mt-2 text-sm font-medium text-green-800">
                      {copyMessage}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs text-gray-500">
                DogLife checks availability, capacity and pricing again
                when the link is created and when the owner completes
                the booking.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}