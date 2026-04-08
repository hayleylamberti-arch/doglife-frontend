import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ================================
   SERVICE TYPES
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

export default function SupplierServicesPage() {
  const queryClient = useQueryClient();

  /* ================================
     FETCH SERVICES
  ================================ */

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/services");
      return res.data.services;
    },
  });

  const services = data ?? [];

  /* ================================
     STATE
  ================================ */

  const [serviceType, setServiceType] = useState("");

  // shared
  const [price, setPrice] = useState("");

  // walking
  const [duration, setDuration] = useState("30");

  // boarding
  const [capacity, setCapacity] = useState("");

  // grooming
  const [smallPrice, setSmallPrice] = useState("");
  const [mediumPrice, setMediumPrice] = useState("");
  const [largePrice, setLargePrice] = useState("");
  const [xlPrice, setXlPrice] = useState("");

  /* ================================
     CREATE SERVICE
  ================================ */

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) throw new Error("Select a service");

      // WALKING
      if (serviceType === "WALKING") {
        return api.post("/api/supplier/services", {
          service: "WALKING",
          baseRate: Number(price),
          durationMinutes: Number(duration),
        });
      }

      // BOARDING
      if (serviceType === "BOARDING") {
        return api.post("/api/supplier/services", {
          service: "BOARDING",
          baseRate: Number(price),
          durationMinutes: null,
          concurrentCapacityDogs: Number(capacity),
        });
      }

      // GROOMING (simple version for now)
      if (serviceType === "GROOMING") {
        return api.post("/api/supplier/services", {
          service: "GROOMING",
          baseRate: Number(smallPrice), // temporary
        });
      }

      // DEFAULT
      return api.post("/api/supplier/services", {
        service: serviceType,
        baseRate: Number(price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setServiceType("");
      setPrice("");
      setDuration("30");
      setCapacity("");
      setSmallPrice("");
      setMediumPrice("");
      setLargePrice("");
      setXlPrice("");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || err.message);
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
     UI
  ================================ */

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      <h1 className="text-2xl font-semibold">Manage Services</h1>

      {/* ADD SERVICE */}
      <div className="border rounded-xl p-6 bg-white shadow-sm space-y-4">

        <h2 className="text-lg font-semibold">Add New Service</h2>

        <select
          className="w-full border rounded px-3 py-2"
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

        {/* ================================
           WALKING
        ================================ */}
        {serviceType === "WALKING" && (
          <>
            <input
              type="number"
              placeholder="Price (ZAR)"
              className="w-full border rounded px-3 py-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <select
              className="w-full border rounded px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="30">30 mins</option>
              <option value="60">60 mins</option>
            </select>
          </>
        )}

        {/* ================================
           BOARDING
        ================================ */}
        {serviceType === "BOARDING" && (
          <>
            <input
              type="number"
              placeholder="Price per night (ZAR)"
              className="w-full border rounded px-3 py-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              type="number"
              placeholder="Capacity (number of dogs)"
              className="w-full border rounded px-3 py-2"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </>
        )}

        {/* ================================
           GROOMING
        ================================ */}
        {serviceType === "GROOMING" && (
          <>
            <p className="text-sm font-medium">Pricing by dog size</p>

            <input
              placeholder="Small (ZAR)"
              className="w-full border p-2 rounded"
              value={smallPrice}
              onChange={(e) => setSmallPrice(e.target.value)}
            />

            <input
              placeholder="Medium (ZAR)"
              className="w-full border p-2 rounded"
              value={mediumPrice}
              onChange={(e) => setMediumPrice(e.target.value)}
            />

            <input
              placeholder="Large (ZAR)"
              className="w-full border p-2 rounded"
              value={largePrice}
              onChange={(e) => setLargePrice(e.target.value)}
            />

            <input
              placeholder="XL (ZAR)"
              className="w-full border p-2 rounded"
              value={xlPrice}
              onChange={(e) => setXlPrice(e.target.value)}
            />
          </>
        )}

        {/* BUTTON */}
        {serviceType && (
          <button
            onClick={() => createMutation.mutate()}
            className="w-full bg-black text-white py-3 rounded-md"
          >
            Add Service
          </button>
        )}

      </div>

      {/* ================================
         EXISTING SERVICES
      ================================ */}

      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Your Services</h2>

        {isLoading && <p>Loading...</p>}

        {!isLoading && services.length === 0 && (
          <p className="text-sm text-gray-500">No services added yet.</p>
        )}

        {services.map((s: any) => (
          <div
            key={s.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{formatService(s.service)}</p>
              <p className="text-sm text-gray-500">
                R{(s.baseRateCents / 100).toFixed(0)}
              </p>
            </div>

            <button
              onClick={() => deleteMutation.mutate(s.id)}
              className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded"
            >
              Delete
            </button>
          </div>
        ))}

      </div>

    </div>
  );
}