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

/* ================================
   SERVICE UNIT LABELS
================================ */

function getServiceUnit(service: string, s: any) {
  switch (service) {
    case "WALKING":
      return `${s.durationMinutes || 30} mins`;

    case "TRAINING":
      return `${s.durationMinutes || 60} mins`;

    case "BOARDING":
      return "per night";

    case "DAYCARE":
      return "per day";

    case "PET_SITTING":
      return "per night";

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

  /* ================================
     STATE
  ================================ */

  const [serviceType, setServiceType] = useState("");

  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");

  const [capacity, setCapacity] = useState("");
  const [additionalDogPrice, setAdditionalDogPrice] = useState("");
  const [boardingType, setBoardingType] = useState("SOCIAL");

  const [groomType, setGroomType] = useState("WASH_BRUSH");
  const [smallPrice, setSmallPrice] = useState("");
  const [mediumPrice, setMediumPrice] = useState("");
  const [largePrice, setLargePrice] = useState("");
  const [xlPrice, setXlPrice] = useState("");

  const [trainingType, setTrainingType] = useState("OBEDIENCE");

  const [pricePerKm, setPricePerKm] = useState("");

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
  });

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

        {serviceType === "WALKING" && (
          <>
            <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="30">30 mins</option>
              <option value="60">60 mins</option>
            </select>
          </>
        )}

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

        {serviceType === "TRAINING" && (
          <>
            <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="60">60 mins</option>
              <option value="90">90 mins</option>
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
              <p className="font-medium">{formatService(s.service)}</p>

              <div className="text-sm text-gray-500 space-y-1">

                {s.baseRateCents && (
                  <p>
                    R{(s.baseRateCents / 100).toFixed(0)}{" "}
                    <span className="text-gray-400 text-xs">
                      {getServiceUnit(s.service, s)}
                    </span>
                  </p>
                )}

                {s.service === "GROOMING" && s.groomingOptions && (
                  <div>
                    <p className="text-xs text-gray-400">
                      {s.groomingOptions.type === "WASH_BRUSH"
                        ? "Wash & Brush"
                        : "Wash & Cut"}
                    </p>

                    <p>Small: R{s.groomingOptions.small}</p>
                    <p>Medium: R{s.groomingOptions.medium}</p>
                    <p>Large: R{s.groomingOptions.large}</p>
                    <p>XL: R{s.groomingOptions.xl}</p>
                  </div>
                )}

                {["BOARDING", "DAYCARE", "PET_SITTING"].includes(s.service) && (
                  <>
                    {s.concurrentCapacityDogs && <p>Capacity: {s.concurrentCapacityDogs}</p>}
                    {s.additionalDogPriceCents && (
                      <p>+R{(s.additionalDogPriceCents / 100).toFixed(0)} per extra dog</p>
                    )}
                  </>
                )}

              </div>
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