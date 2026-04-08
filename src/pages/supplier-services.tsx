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

  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");

  // boarding / daycare / sitting
  const [capacity, setCapacity] = useState("");
  const [additionalDogPrice, setAdditionalDogPrice] = useState("");
  const [boardingType, setBoardingType] = useState("SOCIAL");

  // grooming
  const [groomType, setGroomType] = useState("WASH_BRUSH");
  const [smallPrice, setSmallPrice] = useState("");
  const [mediumPrice, setMediumPrice] = useState("");
  const [largePrice, setLargePrice] = useState("");
  const [xlPrice, setXlPrice] = useState("");

  // training
  const [trainingType, setTrainingType] = useState("OBEDIENCE");

  // transport
  const [pricePerKm, setPricePerKm] = useState("");

  // vet
  const [vetService, setVetService] = useState("VACCINATION");

  /* ================================
     CREATE SERVICE
  ================================ */

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) throw new Error("Select a service");

      switch (serviceType) {
        case "WALKING":
          return api.post("/api/supplier/services", {
            service: "WALKING",
            baseRate: Number(price),
            durationMinutes: Number(duration),
          });

        case "GROOMING":
          return api.post("/api/supplier/services", {
            service: "GROOMING",
            baseRate: Number(smallPrice),
            groomingOptions: {
              type: groomType,
              small: Number(smallPrice),
              medium: Number(mediumPrice),
              large: Number(largePrice),
              xl: Number(xlPrice),
            },
          });

        case "BOARDING":
        case "DAYCARE":
        case "PET_SITTING":
          return api.post("/api/supplier/services", {
            service: serviceType,
            baseRate: Number(price),
            concurrentCapacityDogs: Number(capacity),
            additionalDogPrice: Number(additionalDogPrice),
            boardingType,
          });

        case "TRAINING":
          return api.post("/api/supplier/services", {
            service: "TRAINING",
            baseRate: Number(price),
            durationMinutes: Number(duration),
            trainingType,
          });

        case "PET_TRANSPORT":
          return api.post("/api/supplier/services", {
            service: "PET_TRANSPORT",
            baseRate: Number(price),
            pricePerKm: Number(pricePerKm),
          });

        case "MOBILE_VET":
          return api.post("/api/supplier/services", {
            service: "MOBILE_VET",
            baseRate: Number(price),
            vetService,
          });

        default:
          return api.post("/api/supplier/services", {
            service: serviceType,
            baseRate: Number(price),
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setServiceType("");
      setPrice("");
      setDuration("30");
      setCapacity("");
      setAdditionalDogPrice("");
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
     DELETE
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

        {/* WALKING */}
        {serviceType === "WALKING" && (
          <>
            <input placeholder="Price" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="30">30 mins</option>
              <option value="60">60 mins</option>
            </select>
          </>
        )}

        {/* GROOMING */}
        {serviceType === "GROOMING" && (
          <>
            <select value={groomType} onChange={(e) => setGroomType(e.target.value)}>
              <option value="WASH_BRUSH">Wash & Brush</option>
              <option value="WASH_CUT">Wash & Cut</option>
            </select>

            <input placeholder="Small" value={smallPrice} onChange={(e) => setSmallPrice(e.target.value)} />
            <input placeholder="Medium" value={mediumPrice} onChange={(e) => setMediumPrice(e.target.value)} />
            <input placeholder="Large" value={largePrice} onChange={(e) => setLargePrice(e.target.value)} />
            <input placeholder="XL" value={xlPrice} onChange={(e) => setXlPrice(e.target.value)} />
          </>
        )}

        {/* BOARDING / DAYCARE / SITTING */}
        {["BOARDING", "DAYCARE", "PET_SITTING"].includes(serviceType) && (
          <>
            <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            <input placeholder="Additional dog price" value={additionalDogPrice} onChange={(e) => setAdditionalDogPrice(e.target.value)} />

            <select value={boardingType} onChange={(e) => setBoardingType(e.target.value)}>
              <option value="SOCIAL">Social</option>
              <option value="PRIVATE">Private kennel</option>
            </select>
          </>
        )}

        {/* TRAINING */}
        {serviceType === "TRAINING" && (
          <>
            <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="60">60 mins</option>
              <option value="90">90 mins</option>
            </select>

            <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)}>
              <option value="OBEDIENCE">Obedience</option>
              <option value="BEHAVIOURAL">Behavioural</option>
              <option value="PUPPY">Puppy Training</option>
            </select>
          </>
        )}

        {/* TRANSPORT */}
        {serviceType === "PET_TRANSPORT" && (
          <>
            <input placeholder="Base price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input placeholder="Price per km" value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} />
          </>
        )}

        {/* MOBILE VET */}
        {serviceType === "MOBILE_VET" && (
          <>
            <input placeholder="Call-out fee" value={price} onChange={(e) => setPrice(e.target.value)} />

            <select value={vetService} onChange={(e) => setVetService(e.target.value)}>
              <option value="VACCINATION">Vaccination</option>
              <option value="CHECKUP">Check-up</option>
              <option value="EUTHANASIA">Euthanasia</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </>
        )}

        {serviceType && (
          <button
            onClick={() => createMutation.mutate()}
            className="w-full bg-black text-white py-3 rounded-md"
          >
            Add Service
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Services</h2>

        {isLoading && <p>Loading...</p>}

        {services.map((s: any) => (
          <div key={s.id} className="border p-4 flex justify-between">
            <div>
              <p>{formatService(s.service)}</p>
              <p>R{(s.baseRateCents / 100).toFixed(0)}</p>
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