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
    case "GROOMING":
      return "per visit";
    case "PET_TRANSPORT":
      return "per trip";
    case "MOBILE_VET":
      return "call-out fee";
    default:
      return "";
  }
}

export default function SupplierServicesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
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

  // NEW GROOMING STATE
  const [washBrush, setWashBrush] = useState({ small: "", medium: "", large: "", xl: "" });
  const [washCut, setWashCut] = useState({ small: "", medium: "", large: "", xl: "" });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) throw new Error("Select a service");

      if (serviceType === "GROOMING") {
        const hasAny =
          Object.values(washBrush).some(v => v) ||
          Object.values(washCut).some(v => v);

        if (!hasAny) throw new Error("Enter at least one grooming price");

        return api.post("/api/supplier/services", {
          service: "GROOMING",
          baseRate: Number(washBrush.small || washCut.small || 0),
          groomingOptions: {
            washBrush: {
              small: Number(washBrush.small || 0),
              medium: Number(washBrush.medium || 0),
              large: Number(washBrush.large || 0),
              xl: Number(washBrush.xl || 0),
            },
            washCut: {
              small: Number(washCut.small || 0),
              medium: Number(washCut.medium || 0),
              large: Number(washCut.large || 0),
              xl: Number(washCut.xl || 0),
            },
          },
        });
      }

      return api.post("/api/supplier/services", {
        service: serviceType,
        baseRate: Number(price),
        durationMinutes: Number(duration),
        concurrentCapacityDogs: Number(capacity),
        additionalDogPrice: Number(additionalDogPrice),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setServiceType("");
      setPrice("");
      setDuration("30");
      setCapacity("");
      setAdditionalDogPrice("");
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-semibold">Manage Services</h1>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <h2>Add New Service</h2>

        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          <option value="">Select service</option>
          {SERVICE_TYPES.map(s => (
            <option key={s} value={s}>{formatService(s)}</option>
          ))}
        </select>

        {serviceType === "GROOMING" && (
          <>
            <p className="font-medium">Wash & Brush</p>
            {["small","medium","large","xl"].map(size => (
              <input
                key={size}
                placeholder={size}
                value={(washBrush as any)[size]}
                onChange={(e) =>
                  setWashBrush(prev => ({ ...prev, [size]: e.target.value }))
                }
              />
            ))}

            <p className="font-medium mt-4">Wash & Cut</p>
            {["small","medium","large","xl"].map(size => (
              <input
                key={size}
                placeholder={size}
                value={(washCut as any)[size]}
                onChange={(e) =>
                  setWashCut(prev => ({ ...prev, [size]: e.target.value }))
                }
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

        {services.map((s: any) => (
          <div key={s.id} className="border p-4 flex justify-between">
            <div>
              <p>{formatService(s.service)}</p>

              {s.service === "GROOMING" && s.groomingOptions && (
                <>
                  <p className="text-xs text-gray-400">Wash & Brush</p>
                  {Object.entries(s.groomingOptions.washBrush || {}).map(([k,v]: any) =>
                    v > 0 && <p key={k}>{k}: R{v}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-2">Wash & Cut</p>
                  {Object.entries(s.groomingOptions.washCut || {}).map(([k,v]: any) =>
                    v > 0 && <p key={k}>{k}: R{v}</p>
                  )}
                </>
              )}
            </div>

            <button onClick={() => deleteMutation.mutate(s.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}