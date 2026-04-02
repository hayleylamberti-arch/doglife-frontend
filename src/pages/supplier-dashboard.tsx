import { useState } from "react";
import { api } from "@/lib/api";

type ServiceType =
  | "WALKING"
  | "TRAINING"
  | "GROOMING"
  | "BOARDING"
  | "PET_TRANSPORT";

export default function ServiceBuilder() {
  const [service, setService] = useState<ServiceType>("WALKING");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [groomingType, setGroomingType] = useState("WASH");
  const [dogSize, setDogSize] = useState("MEDIUM");

  const handleSave = async () => {
    try {
      await api.post("/api/supplier/services", {
        service,
        baseRate: Number(price),
        durationMinutes: duration ? Number(duration) : null,
        groomingType,
        dogSize,
      });

      alert("✅ Service saved");
      setPrice("");
      setDuration("");

    } catch (err) {
      console.error(err);
      alert("❌ Failed to save service");
    }
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-xl shadow">

      {/* SERVICE SELECT */}
      <select
        className="w-full border p-2 rounded"
        value={service}
        onChange={(e) => setService(e.target.value as ServiceType)}
      >
        <option value="WALKING">Dog Walking</option>
        <option value="TRAINING">Training</option>
        <option value="GROOMING">Grooming</option>
        <option value="BOARDING">Boarding</option>
        <option value="PET_TRANSPORT">Pet Transport</option>
      </select>

      {/* DURATION (WALKING / TRAINING / TRANSPORT) */}
      {(service === "WALKING" ||
        service === "TRAINING" ||
        service === "PET_TRANSPORT") && (
        <select
          className="w-full border p-2 rounded"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        >
          <option value="">Select duration</option>
          <option value="30">30 mins</option>
          <option value="45">45 mins</option>
          <option value="60">60 mins</option>
          <option value="90">90 mins</option>
        </select>
      )}

      {/* GROOMING OPTIONS */}
      {service === "GROOMING" && (
        <>
          <select
            className="w-full border p-2 rounded"
            value={groomingType}
            onChange={(e) => setGroomingType(e.target.value)}
          >
            <option value="WASH">Wash & Brush</option>
            <option value="CUT">Wash & Cut</option>
          </select>

          <select
            className="w-full border p-2 rounded"
            value={dogSize}
            onChange={(e) => setDogSize(e.target.value)}
          >
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="XL">XL</option>
          </select>
        </>
      )}

      {/* BOARDING INFO */}
      {service === "BOARDING" && (
        <p className="text-sm text-gray-500">
          Price is per night (1 dog). Multi-dog pricing coming next.
        </p>
      )}

      {/* TRANSPORT INFO */}
      {service === "PET_TRANSPORT" && (
        <p className="text-sm text-gray-500">
          Set your base trip price. Distance pricing coming next.
        </p>
      )}

      {/* PRICE INPUT */}
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-500">R</span>
        <input
          type="number"
          placeholder="Price"
          className="w-full border p-2 pl-8 rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        className="w-full bg-orange-500 text-white py-2 rounded"
      >
        Save Service
      </button>
    </div>
  );
}