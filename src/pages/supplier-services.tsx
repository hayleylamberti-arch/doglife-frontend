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

  const [washBrush, setWashBrush] = useState({ small: "", medium: "", large: "", xl: "" });
  const [washCut, setWashCut] = useState({ small: "", medium: "", large: "", xl: "" });

  const [editingService, setEditingService] = useState<any>(null);

  /* ================================
     CREATE
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
        const hasAny =
          Object.values(washBrush).some(v => v) ||
          Object.values(washCut).some(v => v);

        if (!hasAny) {
  alert("Please enter at least one grooming price");
  return;
}

        return api.post("/api/supplier/services", {
          service: "GROOMING",
          baseRate: 0,
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

      // ✅ critical safety fallback
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

  /* ================================
     DELETE
  ================================ */

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/api/supplier/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  /* ================================
     UPDATE
  ================================ */

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.patch(`/api/supplier/services/${payload.id}`, payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  /* ================================
     GROUPING
  ================================ */

  const groupedServices = services.reduce((acc: any, service: any) => {
    if (!acc[service.service]) acc[service.service] = [];
    acc[service.service].push(service);
    return acc;
  }, {});

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-semibold">Manage Services</h1>

      {/* EDIT PANEL */}
      {editingService && (
        <div className="border rounded-xl p-6 bg-yellow-50 space-y-4">

          <h2 className="font-semibold">
            Edit {formatService(editingService.type)}
          </h2>

          {/* WALKING / TRAINING */}
          {["WALKING", "TRAINING"].includes(editingService.type) &&
            editingService.group.map((s: any) => (
              <div key={s.id} className="flex gap-2">
                <span>{s.durationMinutes} mins</span>
                <input
                  defaultValue={(s.baseRateCents / 100).toFixed(0)}
                  onBlur={(e) =>
                    updateMutation.mutate({
                      id: s.id,
                      data: {
                        baseRateCents: Math.round(Number(e.target.value) * 100),
                      },
                    })
                  }
                  className="border px-2"
                />
              </div>
            ))}

          {/* BOARDING / DAYCARE / SITTING */}
          {["BOARDING", "DAYCARE", "PET_SITTING"].includes(editingService.type) &&
            editingService.group.map((s: any) => (
              <div key={s.id} className="space-y-2">
                <input
                  defaultValue={(s.baseRateCents / 100).toFixed(0)}
                  onBlur={(e) =>
                    updateMutation.mutate({
                      id: s.id,
                      data: {
                        baseRateCents: Math.round(Number(e.target.value) * 100),
                      },
                    })
                  }
                  className="border px-2"
                />

                <input
                  defaultValue={s.concurrentCapacityDogs || ""}
                  placeholder="Capacity"
                  onBlur={(e) =>
                    updateMutation.mutate({
                      id: s.id,
                      data: {
                        concurrentCapacityDogs: Number(e.target.value),
                      },
                    })
                  }
                  className="border px-2"
                />

                <input
                  defaultValue={(s.additionalDogPriceCents || 0) / 100}
                  placeholder="Extra dog price"
                  onBlur={(e) =>
                    updateMutation.mutate({
                      id: s.id,
                      data: {
                        additionalDogPriceCents: Math.round(
                          Number(e.target.value) * 100
                        ),
                      },
                    })
                  }
                  className="border px-2"
                />
              </div>
            ))}

          {/* GROOMING */}
          {editingService.type === "GROOMING" && (() => {
  const combined: any = {
  washBrush: {},
  washCut: {}
};

  editingService.group.forEach((s: any) => {
    Object.entries(s.pricingJson?.washBrush || {}).forEach(([k, v]: any) => {
      if (v > 0) combined.washBrush[k] = v;
    });

    Object.entries(s.pricingJson?.washCut || {}).forEach(([k, v]: any) => {
      if (v > 0) combined.washCut[k] = v;
    });
  });

  return (
    <div>
      {/* Wash & Brush */}
      {Object.keys(combined.washBrush).length > 0 && (
        <>
          <p className="font-medium">Wash & Brush (required)</p>
          {Object.entries(combined.washBrush).map(([k, v]: any) => (
            <p key={k}>{k}: R{v}</p>
          ))}
        </>
      )}

      {/* Wash & Cut */}
      {Object.keys(combined.washCut).length > 0 && (
        <>
          <p className="font-medium mt-2">Wash & Cut</p>
          {Object.entries(combined.washCut).map(([k, v]: any) => (
            <p key={k}>{k}: R{v}</p>
          ))}
        </>
      )}
    </div>
  );
})()}

          <button onClick={() => setEditingService(null)}>
            Close
          </button>

        </div>
      )}

      {/* ADD SERVICE (unchanged) */}
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

        {/* (rest unchanged – already correct) */}

        {serviceType && (
          <button onClick={() => createMutation.mutate()}>
            Add Service
          </button>
        )}
      </div>

      {/* LIST */}
      <div>
        <h2>Your Services</h2>

        {Object.entries(groupedServices).map(([type, group]: any) => (
          <div key={type} className="border rounded-lg p-4 mb-4">

            <div className="flex justify-between">

              <div>
                <p className="font-medium">{formatService(type)}</p>

                <div className="text-sm text-gray-500 mt-2 space-y-1">

                  {type === "GROOMING" &&
                    group.map((s: any) => (
                      <div key={s.id}>
                        {Object.entries(s.pricingJson?.washBrush || {}).map(
                          ([k, v]: any) =>
                            v > 0 && <p key={k}>Brush {k}: R{v}</p>
                        )}
                        {Object.entries(s.pricingJson?.washCut || {}).map(
                          ([k, v]: any) =>
                            v > 0 && <p key={k}>Cut {k}: R{v}</p>
                        )}
                      </div>
                    ))}

                  {type !== "GROOMING" &&
                    group.map((s: any) => (
                      <p key={s.id}>
                        R{(s.baseRateCents / 100).toFixed(0)}{" "}
                        {getServiceUnit(type, s)}
                      </p>
                    ))}

                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditingService({ type, group })}>
                  Edit
                </button>

                <button
                  onClick={() =>
                    group.forEach((s: any) => deleteMutation.mutate(s.id))
                  }
                >
                  Delete
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}