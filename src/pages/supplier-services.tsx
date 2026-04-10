import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    PET_SITTING: "🛋️ Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet",
  };
  return map[service] ?? service;
}

function getServiceUnit(service: string, s: any) {
  switch (service) {
    case "WALKING":
    case "TRAINING":
      return `${s.durationMinutes || 30} mins`;
    case "BOARDING":
    case "PET_SITTING":
      return "per night";
    case "DAYCARE":
      return "per day";
    case "PET_TRANSPORT":
      return "per trip";
    case "MOBILE_VET":
      return "call-out fee";
    default:
      return "";
  }
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

export default function SupplierServicesPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/services");
      return res.data.services;
    },
  });

  const services = data ?? [];

  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

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
      if (!serviceType) throw new Error("Select a service");

      if (serviceType === "GROOMING") {
        return api.post("/api/supplier/services", {
          service: "GROOMING",
          baseRate: 0,
          groomingOptions: { washBrush, washCut },
        });
      }

      return api.post("/api/supplier/services", {
        service: serviceType,
        baseRate: Number(price),
        durationMinutes: Number(duration),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setServiceType("");
      setPrice("");
      setDuration("30");
      setWashBrush({ small: "", medium: "", large: "", xl: "" });
      setWashCut({ small: "", medium: "", large: "", xl: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/supplier/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.patch(`/api/supplier/services/${payload.id}`, payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setEditingId(null);
    },
  });

  const groupedServices = services.reduce((acc: any, service: any) => {
    if (!acc[service.service]) acc[service.service] = [];
    acc[service.service].push(service);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Manage Services</h1>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <h2>Add New Service</h2>

        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="">Select service</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {formatService(s)}
            </option>
          ))}
        </select>

        {serviceType && serviceType !== "GROOMING" && (
          <>
            <input
              placeholder="Price (R)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border px-2 block"
            />

            <input
              placeholder="Duration (mins)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="border px-2 block"
            />
          </>
        )}

        {serviceType === "GROOMING" && (
          <>
            <p>Wash & Brush</p>
            {["small", "medium", "large", "xl"].map((size) => (
              <input
                key={size}
                placeholder={size}
                value={(washBrush as any)[size]}
                onChange={(e) =>
                  setWashBrush((prev) => ({
                    ...prev,
                    [size]: e.target.value,
                  }))
                }
                className="border px-2 block"
              />
            ))}

            <p>Wash & Cut</p>
            {["small", "medium", "large", "xl"].map((size) => (
              <input
                key={size}
                placeholder={size}
                value={(washCut as any)[size]}
                onChange={(e) =>
                  setWashCut((prev) => ({
                    ...prev,
                    [size]: e.target.value,
                  }))
                }
                className="border px-2 block"
              />
            ))}
          </>
        )}

        {serviceType && (
          <button onClick={() => createMutation.mutate()}>
            Add Service
          </button>
        )}
      </div>

      <div>
        <h2>Your Services</h2>

        {Object.entries(groupedServices).map(([type, group]: any) => (
          <div key={type} className="border rounded-lg p-4 mb-4">
            <p className="font-medium">{formatService(type)}</p>

            <div className="text-sm text-gray-500 mt-2 space-y-1">
              {type !== "GROOMING" &&
                group.map((s: any) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    {editingId === s.id ? (
                      <>
                        <input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="border px-2"
                        />
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: s.id,
                              data: {
                                baseRateCents: Math.round(Number(editPrice) * 100),
                              },
                            })
                          }
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <span>
                          R{(s.baseRateCents / 100).toFixed(0)}{" "}
                          {getServiceUnit(type, s)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setEditPrice((s.baseRateCents / 100).toFixed(0));
                          }}
                        >
                          Edit
                        </button>
                      </>
                    )}
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
                    <div key={s.id}>
                      <p className="text-green-600 font-semibold">
                        Example (2 dogs): R{(exampleTotal / 100).toFixed(0)}
                      </p>

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
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() =>
                  group.forEach((s: any) => deleteMutation.mutate(s.id))
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}