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

export default function SupplierServicesPage() {
  const queryClient = useQueryClient();

  /* ================================
     FETCH SERVICES
  ================================ */

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/services");
      return res.data;
    },
  });

  const services = data?.services ?? [];

  /* ================================
     FORM STATE
  ================================ */

  const [service, setService] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");

  /* ================================
     CREATE SERVICE
  ================================ */

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!service || !price) {
        throw new Error("Missing fields");
      }

      return api.post("/api/supplier/services", {
        service,
        baseRateCents: Number(price) * 100,
        durationMinutes: Number(duration),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setService("");
      setPrice("");
      setDuration("60");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || err.message);
    },
  });

  /* ================================
     TOGGLE ACTIVE
  ================================ */

  const toggleMutation = useMutation({
    mutationFn: async (serviceItem: any) => {
      return api.patch(`/api/supplier/services/${serviceItem.id}`, {
        isActive: !serviceItem.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-semibold">
        Manage Services
      </h1>

      {/* ================================
         ADD SERVICE
      ================================ */}

      <div className="border rounded-xl p-6 bg-white shadow-sm space-y-4">

        <h2 className="text-lg font-semibold">
          Add New Service
        </h2>

        <select
          className="w-full border rounded px-3 py-2"
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          <option value="">Select service</option>

          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {formatService(s)}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Price (e.g. 150)"
          className="w-full border rounded px-3 py-2"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          type="number"
          placeholder="Duration (minutes)"
          className="w-full border rounded px-3 py-2"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-md"
        >
          {createMutation.isPending ? "Adding..." : "Add Service"}
        </button>

      </div>

      {/* ================================
         EXISTING SERVICES
      ================================ */}

      <div className="space-y-4">

        <h2 className="text-lg font-semibold">
          Your Services
        </h2>

        {isLoading && <p>Loading services...</p>}

        {!isLoading && services.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No services added yet.
          </p>
        )}

        {services.map((s: any) => (
          <div
            key={s.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >

            <div>
              <p className="font-medium">
                {formatService(s.service)}
              </p>

              <p className="text-sm text-gray-500">
                R{(s.baseRateCents / 100).toFixed(0)} • {s.durationMinutes} mins
              </p>
            </div>

            <button
              onClick={() => toggleMutation.mutate(s)}
              className={`px-4 py-2 rounded-md text-sm ${
                s.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {s.isActive ? "Active" : "Inactive"}
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}