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
  "MOBILE_VET"
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
    MOBILE_VET: "🩺 Mobile Vet"
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
      (t) =>
        t.category === selectedCategory &&
        t.dogSize === dog.size
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
  const [capacity, setCapacity] = useState("");
  const [additionalDogPrice, setAdditionalDogPrice] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");

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

  /* ================================
     CREATE (FIXED)
  ================================ */

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) throw new Error("Select a service");

      if (serviceType === "WALKING" || serviceType === "TRAINING") {
        return api.post("/api/supplier/services", {
          service: serviceType,
          baseRate: Number(price),
          durationMinutes: Number(duration),
        });
      }

      if (["BOARDING", "DAYCARE", "PET_SITTING"].includes(serviceType)) {
        return api.post("/api/supplier/services", {
          service: serviceType,
          baseRate: Number(price),
          concurrentCapacityDogs: Number(capacity),
          additionalDogPrice: Number(additionalDogPrice),
        });
      }

      if (serviceType === "PET_TRANSPORT") {
        return api.post("/api/supplier/services", {
          service: "PET_TRANSPORT",
          baseRate: Number(price),
          pricePerKm: Number(pricePerKm),
        });
      }

      if (serviceType === "MOBILE_VET") {
        return api.post("/api/supplier/services", {
          service: "MOBILE_VET",
          baseRate: Number(price),
        });
      }

      if (serviceType === "GROOMING") {
        return api.post("/api/supplier/services", {
          service: "GROOMING",
          baseRate: 0,
          groomingOptions: {
            washBrush,
            washCut,
          },
        });
      }

      throw new Error("Invalid service type");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setServiceType("");
      setPrice("");
      setDuration("30");
      setCapacity("");
      setAdditionalDogPrice("");
      setPricePerKm("");
      setWashBrush({ small: "", medium: "", large: "", xl: "" });
      setWashCut({ small: "", medium: "", large: "", xl: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/api/supplier/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
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

      {/* ADD SERVICE */}
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

        {/* GROOMING INPUT */}
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

      {/* SERVICES LIST */}
      <div>
        <h2>Your Services</h2>

        {Object.entries(groupedServices).map(([type, group]: any) => (
          <div key={type} className="border rounded-lg p-4 mb-4">

            <p className="font-medium">{formatService(type)}</p>

            <div className="text-sm text-gray-500 mt-2 space-y-1">

              {type === "GROOMING" &&
                group.map((s: any) => {
                  const brush =
                    s.pricingTiers?.filter(
                      (t: any) => t.category === "WASH_BRUSH"
                    ) || [];

                  const cut =
                    s.pricingTiers?.filter(
                      (t: any) => t.category === "WASH_CUT"
                    ) || [];

                  const exampleTotal =
                    brush.length > 0
                      ? calculateGroomingPrice({
                          tiers: s.pricingTiers || [],
                          selectedCategory: "WASH_BRUSH",
                          dogs: [
                            { size: "SMALL" },
                            { size: "MEDIUM" },
                          ],
                        })
                      : null;

                  return (
                    <div key={s.id}>

                      {exampleTotal && (
                        <p className="text-green-600 font-semibold">
                          Example (2 dogs): R{(exampleTotal / 100).toFixed(0)}
                        </p>
                      )}

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

              {type !== "GROOMING" &&
                group.map((s: any) => (
                  <p key={s.id}>
                    R{(s.baseRateCents / 100).toFixed(0)}{" "}
                    {getServiceUnit(type, s)}
                  </p>
                ))}
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={() => alert("Edit coming next 🚀")}>
                Edit
              </button>

              <button
                onClick={() =>
                  group.forEach((s: any) =>
                    deleteMutation.mutate(s.id)
                  )
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