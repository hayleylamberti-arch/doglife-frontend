import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";

const SERVICE_TYPES = [
  "WALKING",
  "GROOMING",
  "BOARDING",
  "TRAINING",
  "DAYCARE",
  "PET_SITTING",
  "PET_TRANSPORT",
  "MOBILE_VET",
];

function formatService(service: string) {
  const map: Record<string, string> = {
    WALKING: "🐕 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
    PET_SITTING: "🩷 Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet",
  };
  return map[service] ?? service;
}

function getServiceUnit(service: string, s: any) {
  switch (service) {
    case "WALKING":
    case "TRAINING":
    case "MOBILE_VET":
    case "PET_TRANSPORT":
      return `${s.durationMinutes || 30} mins`;
    case "BOARDING":
    case "PET_SITTING":
      return "per night";
    case "DAYCARE":
      return "per day";
    default:
      return "";
  }
}

function formatBufferMinutes(value?: number | null) {
  if (value == null || value === 0) return "No buffer";
  return `${value} min buffer`;
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to save service"
    );
  }

  if (error instanceof Error) return error.message;

  return "Failed to save service";
}

type DogSize = "SMALL" | "MEDIUM" | "LARGE" | "XL";

type PricingTier = {
  category: string;
  dogSize: DogSize;
  priceCents: number;
};

type EditServiceForm = {
  price: string;
  durationMinutes: string;
  bufferMinutes: string;
  maxDogsPerBooking: string;
  concurrentCapacityDogs: string;
  additionalDogEnabled: boolean;
  additionalDogPrice: string;
  daycareHalfDayPrice: string;
  daycareFullDayPrice: string;
};

function calculateGroomingPrice({
  tiers,
  selectedCategory,
  dogs,
}: {
  tiers: PricingTier[];
  selectedCategory: string;
  dogs: { size: DogSize }[];
}) {
  let total = 0;

  dogs.forEach((dog) => {
    const match = tiers.find(
      (t) => t.category === selectedCategory && t.dogSize === dog.size
    );

    if (!match) return;

    total += match.priceCents;
  });

  return total;
}

function serviceDefaults(serviceType: string) {
  switch (serviceType) {
    case "WALKING":
      return { unit: "PER_WALK" };
    case "TRAINING":
      return { unit: "PER_SESSION" };
    case "MOBILE_VET":
      return { unit: "PER_VISIT" };
    case "PET_TRANSPORT":
      return { unit: "PER_TRIP" };
    case "BOARDING":
      return { unit: "PER_NIGHT" };
    case "PET_SITTING":
      return { unit: "PER_NIGHT" };
    case "DAYCARE":
      return { unit: "PER_DAY" };
    case "GROOMING":
      return { unit: "PER_VISIT" };
    default:
      return { unit: "PER_VISIT" };
  }
}

function shouldShowDogCapacity(serviceType: string) {
  return ["BOARDING", "DAYCARE", "PET_SITTING", "WALKING"].includes(serviceType);
}

function formatRandFromCents(value?: number | null) {
  return `R${(((value ?? 0) as number) / 100).toFixed(0)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function centsToRandInput(value?: number | null) {
  if (value == null) return "";
  return String(value / 100);
}

export default function SupplierServicesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => {
      const res = await api.get("/api/supplierServices");
      return res.data.services;
    },
  });

  const services = data ?? [];

  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState("");

  const [boardingExtraDogEnabled, setBoardingExtraDogEnabled] = useState(false);
  const [boardingExtraDogPrice, setBoardingExtraDogPrice] = useState("");

  const [daycareHalfDayPrice, setDaycareHalfDayPrice] = useState("");
  const [daycareFullDayPrice, setDaycareFullDayPrice] = useState("");
  const [daycareExtraDogEnabled, setDaycareExtraDogEnabled] = useState(false);
  const [daycareExtraDogPrice, setDaycareExtraDogPrice] = useState("");

  const [maxDogsPerBooking, setMaxDogsPerBooking] = useState("");
  const [concurrentCapacityDogs, setConcurrentCapacityDogs] = useState("");

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditServiceForm | null>(null);

  const [blockInputs, setBlockInputs] = useState<
    Record<string, { startDate: string; endDate: string; reason: string }>
  >({});

  const [washBrush, setWashBrush] = useState({
    small: "",
    medium: "",
    large: "",
    xl: "",
  });

  const [washCut, setWashCut] = useState({
    small: "",
    medium: "",
    large: "",
    xl: "",
  });

  const resetForm = () => {
    setServiceType("");
    setPrice("");
    setDuration("");
    setBufferMinutes("");
    setBoardingExtraDogEnabled(false);
    setBoardingExtraDogPrice("");
    setDaycareHalfDayPrice("");
    setDaycareFullDayPrice("");
    setDaycareExtraDogEnabled(false);
    setDaycareExtraDogPrice("");
    setMaxDogsPerBooking("");
    setConcurrentCapacityDogs("");
    setWashBrush({ small: "", medium: "", large: "", xl: "" });
    setWashCut({ small: "", medium: "", large: "", xl: "" });
  };

  const startEditing = (s: any) => {
    setEditingServiceId(s.id);
    setEditForm({
      price: centsToRandInput(s.baseRateCents),
      durationMinutes: s.durationMinutes ? String(s.durationMinutes) : "",
      bufferMinutes: s.bufferMinutes ? String(s.bufferMinutes) : "",
      maxDogsPerBooking: s.maxDogsPerBooking ? String(s.maxDogsPerBooking) : "",
      concurrentCapacityDogs: s.concurrentCapacityDogs
        ? String(s.concurrentCapacityDogs)
        : "",
      additionalDogEnabled: Boolean(s.additionalDogEnabled),
      additionalDogPrice: centsToRandInput(s.additionalDogPriceCents),
      daycareHalfDayPrice: centsToRandInput(s.pricingJson?.halfDayPriceCents),
      daycareFullDayPrice: centsToRandInput(
        s.pricingJson?.fullDayPriceCents ?? s.baseRateCents
      ),
    });
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setEditForm(null);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ service }: { service: any }) => {
      if (!editForm) throw new Error("Nothing to update");

      const payload: any = {
        bufferMinutes: Number(editForm.bufferMinutes || "0"),
        maxDogsPerBooking:
          editForm.maxDogsPerBooking === ""
            ? null
            : Number(editForm.maxDogsPerBooking),
        concurrentCapacityDogs:
          editForm.concurrentCapacityDogs === ""
            ? null
            : Number(editForm.concurrentCapacityDogs),
        additionalDogEnabled: editForm.additionalDogEnabled,
        additionalDogPriceCents: editForm.additionalDogEnabled
          ? Math.round(Number(editForm.additionalDogPrice || "0") * 100)
          : null,
      };

      if (service.service === "DAYCARE") {
        if (
          editForm.daycareHalfDayPrice === "" ||
          editForm.daycareFullDayPrice === ""
        ) {
          throw new Error("Half day and full day prices are required");
        }

        payload.baseRateCents = Math.round(
          Number(editForm.daycareFullDayPrice) * 100
        );
        payload.pricingJson = {
          halfDayPriceCents: Math.round(
            Number(editForm.daycareHalfDayPrice) * 100
          ),
          fullDayPriceCents: Math.round(
            Number(editForm.daycareFullDayPrice) * 100
          ),
        };
      } else {
        if (!editForm.price || Number(editForm.price) <= 0) {
          throw new Error("Enter a valid price");
        }

        payload.baseRateCents = Math.round(Number(editForm.price) * 100);
      }

      if (!["BOARDING", "PET_SITTING", "DAYCARE", "GROOMING"].includes(service.service)) {
        if (!editForm.durationMinutes || Number(editForm.durationMinutes) <= 0) {
          throw new Error("Enter a valid duration");
        }

        payload.durationMinutes = Number(editForm.durationMinutes);
      }

      return api.patch(`/api/supplierServices/${service.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      cancelEditing();
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: async ({
      serviceId,
      startDate,
      endDate,
      reason,
    }: {
      serviceId: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      return api.post(`/api/supplierServices/${serviceId}/availability-blocks`, {
        startAt: `${startDate}T00:00:00.000Z`,
        endAt: `${endDate}T23:59:59.000Z`,
        reason: reason || null,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setBlockInputs((prev) => ({
        ...prev,
        [variables.serviceId]: { startDate: "", endDate: "", reason: "" },
      }));
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) =>
      api.delete(`/api/supplierServices/availability-blocks/${blockId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) throw new Error("Select a service");

      const defaults = serviceDefaults(serviceType);
      const showDogCapacity = shouldShowDogCapacity(serviceType);
      const isDaycare = serviceType === "DAYCARE";
      const isBoarding = serviceType === "BOARDING";

      if (
        showDogCapacity &&
        maxDogsPerBooking &&
        Number(maxDogsPerBooking) <= 0
      ) {
        throw new Error("Enter a valid maximum dogs per booking");
      }

      if (
        showDogCapacity &&
        concurrentCapacityDogs &&
        Number(concurrentCapacityDogs) <= 0
      ) {
        throw new Error("Enter a valid concurrent capacity");
      }

      if (
        showDogCapacity &&
        maxDogsPerBooking &&
        concurrentCapacityDogs &&
        Number(concurrentCapacityDogs) < Number(maxDogsPerBooking)
      ) {
        throw new Error(
          "Concurrent capacity cannot be less than maximum dogs per booking"
        );
      }

      if (serviceType === "GROOMING") {
        return api.post("/api/supplierServices", {
          services: [
            {
              service: "GROOMING",
              unit: defaults.unit,
              baseRateCents: 1,
              durationMinutes: null,
              bufferMinutes: Number(bufferMinutes || "0"),
              groomingOptions: { washBrush, washCut },
              maxDogsPerBooking: null,
              concurrentCapacityDogs: null,
            },
          ],
        });
      }

      if (isDaycare) {
        if (daycareHalfDayPrice === "" || Number(daycareHalfDayPrice) < 0) {
          throw new Error("Enter a valid half day price");
        }

        if (daycareFullDayPrice === "" || Number(daycareFullDayPrice) < 0) {
          throw new Error("Enter a valid full day price");
        }

        if (!maxDogsPerBooking || Number(maxDogsPerBooking) <= 0) {
          throw new Error("Enter a valid maximum dogs per booking");
        }

        return api.post("/api/supplierServices", {
          services: [
            {
              service: serviceType,
              unit: defaults.unit,
              baseRateCents: Math.round(Number(daycareFullDayPrice) * 100),
              durationMinutes: null,
              bufferMinutes: Number(bufferMinutes || "0"),
              pricingJson: {
                halfDayPriceCents: Math.round(Number(daycareHalfDayPrice) * 100),
                fullDayPriceCents: Math.round(Number(daycareFullDayPrice) * 100),
              },
              additionalDogEnabled: daycareExtraDogEnabled,
              additionalDogPriceCents: daycareExtraDogEnabled
                ? Math.round(Number(daycareExtraDogPrice) * 100)
                : null,
              maxDogsPerBooking: Number(maxDogsPerBooking),
              concurrentCapacityDogs:
                Number(concurrentCapacityDogs || "0") || null,
            },
          ],
        });
      }

      if (!price || Number(price) <= 0) {
        throw new Error("Enter a valid price");
      }

      const requiresDuration = !["BOARDING", "PET_SITTING", "DAYCARE"].includes(
        serviceType
      );

      if (requiresDuration && (!duration || Number(duration) <= 0)) {
        throw new Error("Enter a valid time in minutes");
      }

      if (
        isBoarding &&
        boardingExtraDogEnabled &&
        (!boardingExtraDogPrice || Number(boardingExtraDogPrice) < 0)
      ) {
        throw new Error("Enter a valid extra dog price");
      }

      return api.post("/api/supplierServices", {
        services: [
          {
            service: serviceType,
            unit: defaults.unit,
            baseRateCents: Math.round(Number(price) * 100),
            durationMinutes: requiresDuration ? Number(duration) : null,
            bufferMinutes: Number(bufferMinutes || "0"),
            additionalDogEnabled: isBoarding ? boardingExtraDogEnabled : false,
            additionalDogPriceCents:
              isBoarding && boardingExtraDogEnabled
                ? Math.round(Number(boardingExtraDogPrice) * 100)
                : null,
            maxDogsPerBooking: showDogCapacity
              ? Number(maxDogsPerBooking || "0") || null
              : null,
            concurrentCapacityDogs: showDogCapacity
              ? Number(concurrentCapacityDogs || "0") || null
              : null,
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/supplierServices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  const groupedServices = services.reduce((acc: any, service: any) => {
    if (!acc[service.service]) acc[service.service] = [];
    acc[service.service].push(service);
    return acc;
  }, {});

  const showDurationInput =
    serviceType &&
    !["GROOMING", "BOARDING", "PET_SITTING", "DAYCARE"].includes(serviceType);

  const showBufferInput = Boolean(serviceType);
  const isBoarding = serviceType === "BOARDING";
  const isDaycare = serviceType === "DAYCARE";
  const showDogCapacityInput = shouldShowDogCapacity(serviceType);

  const renderEditForm = (s: any) => {
    if (editingServiceId !== s.id || !editForm) return null;

    const showCapacity = shouldShowDogCapacity(s.service);
    const showDuration = !["BOARDING", "PET_SITTING", "DAYCARE", "GROOMING"].includes(
      s.service
    );

    return (
      <div className="rounded-lg border border-gray-200 p-3 space-y-3 bg-gray-50">
        <p className="font-medium text-gray-700">Edit Service</p>

        {s.service === "DAYCARE" ? (
          <>
            <input
              type="number"
              min="0"
              placeholder="Half day price (R)"
              value={editForm.daycareHalfDayPrice}
              onChange={(e) =>
                setEditForm({ ...editForm, daycareHalfDayPrice: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />
            <input
              type="number"
              min="0"
              placeholder="Full day price (R)"
              value={editForm.daycareFullDayPrice}
              onChange={(e) =>
                setEditForm({ ...editForm, daycareFullDayPrice: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />
          </>
        ) : (
          <input
            type="number"
            min="0"
            placeholder="Price (R)"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            className="border rounded px-3 py-2 block w-full"
          />
        )}

        {showDuration ? (
          <input
            type="number"
            min="1"
            placeholder="Duration minutes"
            value={editForm.durationMinutes}
            onChange={(e) =>
              setEditForm({ ...editForm, durationMinutes: e.target.value })
            }
            className="border rounded px-3 py-2 block w-full"
          />
        ) : null}

        <input
          type="number"
          min="0"
          placeholder="Buffer minutes"
          value={editForm.bufferMinutes}
          onChange={(e) =>
            setEditForm({ ...editForm, bufferMinutes: e.target.value })
          }
          className="border rounded px-3 py-2 block w-full"
        />

        {showCapacity ? (
          <>
            <input
              type="number"
              min="1"
              placeholder="Maximum dogs per booking"
              value={editForm.maxDogsPerBooking}
              onChange={(e) =>
                setEditForm({ ...editForm, maxDogsPerBooking: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />
            <input
              type="number"
              min="1"
              placeholder="Total concurrent dog capacity"
              value={editForm.concurrentCapacityDogs}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  concurrentCapacityDogs: e.target.value,
                })
              }
              className="border rounded px-3 py-2 block w-full"
            />
          </>
        ) : null}

        {(s.service === "BOARDING" || s.service === "DAYCARE") ? (
          <>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={editForm.additionalDogEnabled}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    additionalDogEnabled: e.target.checked,
                  })
                }
              />
              Enable extra dog pricing
            </label>

            {editForm.additionalDogEnabled ? (
              <input
                type="number"
                min="0"
                placeholder="Extra dog price (R)"
                value={editForm.additionalDogPrice}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    additionalDogPrice: e.target.value,
                  })
                }
                className="border rounded px-3 py-2 block w-full"
              />
            ) : null}
          </>
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={() => updateMutation.mutate({ service: s })}
            disabled={updateMutation.isPending}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>

          <button
            onClick={cancelEditing}
            className="rounded border px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>

        {updateMutation.isError ? (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(updateMutation.error)}
          </p>
        ) : null}
      </div>
    );
  };

  const renderAvailabilityBlocks = (s: any) => {
    const input = blockInputs[s.id] || {
      startDate: "",
      endDate: "",
      reason: "",
    };

    return (
      <div className="mt-4 rounded-lg border border-gray-200 p-3 space-y-3">
        <p className="font-medium text-gray-700">Blocked Dates</p>

        {s.availabilityBlocks?.length ? (
          <div className="space-y-2">
            {s.availabilityBlocks.map((block: any) => (
              <div
                key={block.id}
                className="flex items-center justify-between gap-3 rounded border p-2"
              >
                <div>
                  <p>
                    {formatDate(block.startAt)} - {formatDate(block.endAt)}
                  </p>
                  {block.reason ? (
                    <p className="text-xs text-gray-500">{block.reason}</p>
                  ) : null}
                </div>

                <button
                  onClick={() => deleteBlockMutation.mutate(block.id)}
                  disabled={deleteBlockMutation.isPending}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No blocked dates added for this service.
          </p>
        )}

        <div className="grid gap-2 md:grid-cols-3">
          <input
            type="date"
            value={input.startDate}
            onChange={(e) =>
              setBlockInputs((prev) => ({
                ...prev,
                [s.id]: { ...input, startDate: e.target.value },
              }))
            }
            className="border rounded px-3 py-2"
          />

          <input
            type="date"
            value={input.endDate}
            onChange={(e) =>
              setBlockInputs((prev) => ({
                ...prev,
                [s.id]: { ...input, endDate: e.target.value },
              }))
            }
            className="border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Reason e.g. December holiday"
            value={input.reason}
            onChange={(e) =>
              setBlockInputs((prev) => ({
                ...prev,
                [s.id]: { ...input, reason: e.target.value },
              }))
            }
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={() =>
            createBlockMutation.mutate({
              serviceId: s.id,
              startDate: input.startDate,
              endDate: input.endDate,
              reason: input.reason,
            })
          }
          disabled={createBlockMutation.isPending}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {createBlockMutation.isPending ? "Adding..." : "Add blocked dates"}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Manage Services</h1>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <h2 className="text-lg font-medium">Add New Service</h2>

        <select
          value={serviceType}
          onChange={(e) => {
            setServiceType(e.target.value);
            setPrice("");
            setDuration("");
            setBufferMinutes("");
            setBoardingExtraDogEnabled(false);
            setBoardingExtraDogPrice("");
            setDaycareHalfDayPrice("");
            setDaycareFullDayPrice("");
            setDaycareExtraDogEnabled(false);
            setDaycareExtraDogPrice("");
            setMaxDogsPerBooking("");
            setConcurrentCapacityDogs("");
          }}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">Select service</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {formatService(s)}
            </option>
          ))}
        </select>

        {serviceType && serviceType !== "GROOMING" && serviceType !== "DAYCARE" && (
          <input
            type="number"
            min="0"
            placeholder="Price (R)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
        )}

        {isDaycare && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <input
              type="number"
              min="0"
              placeholder="Half day price (R)"
              value={daycareHalfDayPrice}
              onChange={(e) => setDaycareHalfDayPrice(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />

            <input
              type="number"
              min="0"
              placeholder="Full day price (R)"
              value={daycareFullDayPrice}
              onChange={(e) => setDaycareFullDayPrice(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />
          </div>
        )}

        {isBoarding && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={boardingExtraDogEnabled}
                onChange={(e) => setBoardingExtraDogEnabled(e.target.checked)}
              />
              Enable extra dog pricing
            </label>

            {boardingExtraDogEnabled && (
              <input
                type="number"
                min="0"
                placeholder="Extra dog price (R)"
                value={boardingExtraDogPrice}
                onChange={(e) => setBoardingExtraDogPrice(e.target.value)}
                className="border rounded px-3 py-2 block w-full"
              />
            )}
          </div>
        )}

        {isDaycare && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={daycareExtraDogEnabled}
                onChange={(e) => setDaycareExtraDogEnabled(e.target.checked)}
              />
              Enable extra dog pricing
            </label>

            {daycareExtraDogEnabled && (
              <input
                type="number"
                min="0"
                placeholder="Extra dog price (R)"
                value={daycareExtraDogPrice}
                onChange={(e) => setDaycareExtraDogPrice(e.target.value)}
                className="border rounded px-3 py-2 block w-full"
              />
            )}
          </div>
        )}

        {showDogCapacityInput && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <input
              type="number"
              min="1"
              placeholder="Maximum dogs per booking"
              value={maxDogsPerBooking}
              onChange={(e) => setMaxDogsPerBooking(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />

            <input
              type="number"
              min="1"
              placeholder="Total concurrent dog capacity"
              value={concurrentCapacityDogs}
              onChange={(e) => setConcurrentCapacityDogs(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />
          </div>
        )}

        {showDurationInput && (
          <input
            type="number"
            min="1"
            placeholder="Time (mins)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
        )}

        {showBufferInput && serviceType !== "GROOMING" && (
          <input
            type="number"
            min="0"
            placeholder="Time buffer (mins)"
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
        )}

        {serviceType === "GROOMING" && (
  <>
    <p className="font-medium">Wash & Brush</p>
    {["small", "medium", "large", "xl"].map((size) => (
      <input
        key={`wash-brush-${size}`}
        type="number"
        min="0"
        placeholder={`${size} price`}
        value={(washBrush as any)[size]}
        onChange={(e) =>
          setWashBrush((prev) => ({
            ...prev,
            [size]: e.target.value,
          }))
        }
        className="border rounded px-3 py-2 block w-full"
      />
    ))}

    <p className="font-medium">Wash & Cut</p>
    {["small", "medium", "large", "xl"].map((size) => (
      <input
        key={`wash-cut-${size}`}
        type="number"
        min="0"
        placeholder={`${size} price`}
        value={(washCut as any)[size]}
        onChange={(e) =>
          setWashCut((prev) => ({
            ...prev,
            [size]: e.target.value,
          }))
        }
        className="border rounded px-3 py-2 block w-full"
      />
    ))}

    <input
      type="number"
      min="0"
      placeholder="Time buffer (mins)"
      value={bufferMinutes}
      onChange={(e) => setBufferMinutes(e.target.value)}
      className="border rounded px-3 py-2 block w-full"
    />
  </>
)}

        {serviceType && (
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Add Service"}
          </button>
        )}

        {createMutation.isError ? (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(createMutation.error)}
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Your Services</h2>

        {isLoading ? <p>Loading services...</p> : null}

        {!isLoading && Object.keys(groupedServices).length === 0 ? (
          <p className="text-gray-500">No services added yet.</p>
        ) : null}

        {Object.entries(groupedServices).map(([type, group]: any) => (
          <div key={type} className="border rounded-lg p-4 mb-4 bg-white">
            <p className="font-medium">{formatService(type)}</p>

            <div className="text-sm text-gray-500 mt-2 space-y-4">
              {group.map((s: any) => (
                <div key={s.id} className="rounded border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {type === "GROOMING" ? (
  <>
    {(s.pricingTiers || []).filter((t: any) => t.category === "WASH_BRUSH").length > 0 ? (
      <>
        <p className="font-medium">Wash & Brush</p>
        {(s.pricingTiers || [])
          .filter((t: any) => t.category === "WASH_BRUSH")
          .map((t: any) => (
            <p key={t.id}>
              {t.dogSize.toLowerCase()}: R{t.priceCents / 100}
            </p>
          ))}
      </>
    ) : null}

    {(s.pricingTiers || []).filter((t: any) => t.category === "WASH_CUT").length > 0 ? (
      <>
        <p className="font-medium mt-2">Wash & Cut</p>
        {(s.pricingTiers || [])
          .filter((t: any) => t.category === "WASH_CUT")
          .map((t: any) => (
            <p key={t.id}>
              {t.dogSize.toLowerCase()}: R{t.priceCents / 100}
            </p>
          ))}
      </>
    ) : null}
  </>
) : type === "DAYCARE" ? (
  <>
    <p>
      Half day:{" "}
      {formatRandFromCents(s.pricingJson?.halfDayPriceCents)}
    </p>
    <p>
      Full day:{" "}
      {formatRandFromCents(
        s.pricingJson?.fullDayPriceCents ?? s.baseRateCents
      )}
    </p>
  </>
) : (
  <p>
    R{(s.baseRateCents / 100).toFixed(0)}{" "}
    {getServiceUnit(type, s)}
  </p>
)}

                      <p>{formatBufferMinutes(s.bufferMinutes)}</p>

                      {s.maxDogsPerBooking ? (
                        <p>Max dogs per booking: {s.maxDogsPerBooking}</p>
                      ) : null}

                      {s.concurrentCapacityDogs ? (
                        <p>
                          Total concurrent capacity:{" "}
                          {s.concurrentCapacityDogs}
                        </p>
                      ) : null}

                      {(type === "BOARDING" || type === "DAYCARE") &&
                      s.additionalDogEnabled ? (
                        <p>
                          Extra dog:{" "}
                          {formatRandFromCents(s.additionalDogPriceCents)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      {type !== "GROOMING" ? (
  <button
    onClick={() => startEditing(s)}
    className="rounded border px-3 py-1"
  >
    Edit
  </button>
) : null}

                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="rounded border px-3 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {renderEditForm(s)}
                  {renderAvailabilityBlocks(s)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}