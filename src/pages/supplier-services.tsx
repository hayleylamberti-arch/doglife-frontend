import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ================================
   CONSTANTS
================================ */

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

/* ================================
   COMPONENT
================================ */

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

      // prevent duplicates (basic check)
      const exists = services.find((s: any) => s.service === service);
      if (exists) {
        throw new Error("Service already exists");
      }

      return api.post("/api/supplier/services", {
        service,
        baseRate: Number(price),
        durationMinutes:
          service === "BOARDING" || service === "PET_TRANSPORT"
            ? null
            : Number(duration),
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
     DELETE SERVICE
  ================================ */

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/supplier/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  /* ================================
     HELPERS
  ================================ */

  function getDurationLabel() {
    if (service === "WALKING" || service === "TRAINING") {
      return "Duration (minutes)";
    }

    if (service === "BOARDING") {
      return "Per night (no duration needed)";
    }

    if (service === "PET_TRANSPORT") {
      return "Per trip (distance-based)";
    }

    return "Duration";
  }

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
          placeholder="Price (ZAR)"
          className="w-full border rounded px-3 py-2"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        {service !== "BOARDING" && service !== "PET_TRANSPORT" && (
          <input
            type="number"
            placeholder={getDurationLabel()}
            className="w-full border rounded px-3 py-2"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        )}

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full bg-black text-white py-3 rounded-md"
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
          <p className="text-sm text-gray-500">
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
                R{(s.baseRateCents / 100).toFixed(0)}
                {s.durationMinutes ? ` • ${s.durationMinutes} mins` : ""}
              </p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() => toggleMutation.mutate(s)}
                className={`px-3 py-1 rounded text-sm ${
                  s.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {s.isActive ? "Active" : "Inactive"}
              </button>

              <button
                onClick={() => deleteMutation.mutate(s.id)}
                className="px-3 py-1 rounded text-sm bg-red-100 text-red-600"
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