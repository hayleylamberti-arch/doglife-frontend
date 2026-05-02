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

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to save service";
}

type DogSize = "SMALL" | "MEDIUM" | "LARGE" | "XL";

type PricingTier = {
  category: string;
  dogSize: DogSize;
  priceCents: number;
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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) {
        throw new Error("Select a service");
      }

      const defaults = serviceDefaults(serviceType);

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
        serviceType === "BOARDING" &&
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
            additionalDogEnabled:
              serviceType === "BOARDING" ? boardingExtraDogEnabled : false,
            additionalDogPriceCents:
              serviceType === "BOARDING" && boardingExtraDogEnabled
                ? Math.round(Number(boardingExtraDogPrice) * 100)
                : null,
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setServiceType("");
      setPrice("");
      setDuration("");
      setBufferMinutes("");
      setBoardingExtraDogEnabled(false);
      setBoardingExtraDogPrice("");
      setWashBrush({ small: "", medium: "", large: "", xl: "" });
      setWashCut({ small: "", medium: "", large: "", xl: "" });
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

        {serviceType && serviceType !== "GROOMING" && (
          <input
            type="number"
            min="0"
            placeholder="Price (R)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
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

            <p className="text-sm text-gray-500">
              Base price applies to the first dog. Extra dog price is added for
              each additional dog in the same booking.
            </p>
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
          <div className="space-y-1">
            <input
              type="number"
              min="0"
              placeholder="Time buffer (mins)"
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />
            <p className="text-sm text-gray-500">
              Use this for travel, setup, cleanup, or admin time between bookings.
            </p>
          </div>
        )}

        {serviceType === "GROOMING" && (
          <>
            <p className="font-medium">Wash & Brush</p>
            {["small", "medium", "large", "xl"].map((size) => (
              <input
                key={size}
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
                key={size}
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

            <div className="space-y-1">
              <input
                type="number"
                min="0"
                placeholder="Time buffer (mins)"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                className="border rounded px-3 py-2 block w-full"
              />
              <p className="text-sm text-gray-500">
                Use this for travel, setup, cleanup, or admin time between bookings.
              </p>
            </div>
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

            <div className="text-sm text-gray-500 mt-2 space-y-2">
              {type !== "GROOMING" &&
                group.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p>
                        R{(s.baseRateCents / 100).toFixed(0)} {getServiceUnit(type, s)}
                      </p>
                      <p>{formatBufferMinutes(s.bufferMinutes)}</p>
                      {type === "BOARDING" && s.additionalDogEnabled ? (
                        <p>
                          Extra dog: R
                          {((s.additionalDogPriceCents || 0) / 100).toFixed(0)}
                        </p>
                      ) : null}
                    </div>

                    <button
                      onClick={() => deleteMutation.mutate(s.id)}
                      className="rounded border px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                ))}

              {type === "GROOMING" &&
                group.map((s: any) => {
                  const tiers: PricingTier[] = s.pricingTiers || [];
                  const brush = tiers.filter((t) => t.category === "WASH_BRUSH");
                  const cut = tiers.filter((t) => t.category === "WASH_CUT");

                  const exampleTotal = calculateGroomingPrice({
                    tiers,
                    selectedCategory: "WASH_BRUSH",
                    dogs: [{ size: "SMALL" }, { size: "MEDIUM" }],
                  });

                  return (
                    <div key={s.id} className="space-y-2">
                      <p className="text-green-600 font-semibold">
                        Example (2 dogs): R{(exampleTotal / 100).toFixed(0)}
                      </p>

                      <p>{formatBufferMinutes(s.bufferMinutes)}</p>

                      {brush.length > 0 && (
                        <>
                          <p className="font-medium">Wash & Brush</p>
                          {brush.map((t: any) => (
                            <p key={t.id}>
                              {t.dogSize.toLowerCase()}: R{t.priceCents / 100}
                            </p>
                          ))}
                        </>
                      )}

                      {cut.length > 0 && (
                        <>
                          <p className="font-medium mt-2">Wash & Cut</p>
                          {cut.map((t: any) => (
                            <p key={t.id}>
                              {t.dogSize.toLowerCase()}: R{t.priceCents / 100}
                            </p>
                          ))}
                        </>
                      )}

                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="rounded border px-3 py-1 mt-2"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}