import { useState } from "react";
import { api } from "@/lib/api";

type ServiceType =
  | "WALKING"
  | "BOARDING"
  | "GROOMING"
  | "TRAINING"
  | "PET_TRANSPORT";

export default function ServicesSection() {
  const [serviceType, setServiceType] = useState<ServiceType>("WALKING");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState("");
  const [tiers, setTiers] = useState<any[]>([]);

  /* ---------------- ADD TIER ---------------- */
  const addTier = () => {
    setTiers([
      ...tiers,
      { dogSize: "MEDIUM", minDogs: 1, maxDogs: 1, price: "" },
    ]);
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    const payload: any = {
      service: serviceType,
      unit: mapUnit(serviceType),
      baseRateCents: Number(price) * 100,
    };

    if (serviceType === "WALKING" || serviceType === "TRAINING") {
      payload.durationMinutes = duration;
    }

    if (serviceType === "BOARDING") {
      payload.pricingTiers = tiers.map((t) => ({
        ...t,
        priceCents: Number(t.price) * 100,
      }));
    }

    if (serviceType === "GROOMING") {
      payload.groomingOptions = tiers;
    }

    if (serviceType === "PET_TRANSPORT") {
      payload.durationMinutes = duration;
      payload.transportAreaNotes = "Calculated per trip";
    }

    await api.post("/api/supplier/services", {
      services: [payload],
    });

    alert("✅ Service saved");
  };

  return (
    <div className="space-y-6">
      {/* ---------------- SERVICE SELECT ---------------- */}
      <div>
        <label className="block mb-2 font-medium">Service</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value as ServiceType)}
        >
          <option value="WALKING">Dog Walking</option>
          <option value="BOARDING">Boarding</option>
          <option value="GROOMING">Grooming</option>
          <option value="TRAINING">Training</option>
          <option value="PET_TRANSPORT">Pet Transport</option>
        </select>
      </div>

      {/* ---------------- WALKING / TRAINING ---------------- */}
      {(serviceType === "WALKING" || serviceType === "TRAINING") && (
        <>
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
          />

          <input
            type="number"
            placeholder="Price (ZAR)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </>
      )}

      {/* ---------------- BOARDING ---------------- */}
      {serviceType === "BOARDING" && (
        <div>
          <button
            onClick={addTier}
            className="bg-black text-white px-3 py-2 rounded"
          >
            Add Pricing Tier
          </button>

          {tiers.map((tier, index) => (
            <div key={index} className="border p-3 mt-3 rounded space-y-2">
              <select
                value={tier.dogSize}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].dogSize = e.target.value;
                  setTiers(updated);
                }}
              >
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
                <option value="XL">XL</option>
              </select>

              <input
                type="number"
                placeholder="Min dogs"
                value={tier.minDogs}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].minDogs = Number(e.target.value);
                  setTiers(updated);
                }}
              />

              <input
                type="number"
                placeholder="Max dogs"
                value={tier.maxDogs}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].maxDogs = Number(e.target.value);
                  setTiers(updated);
                }}
              />

              <input
                type="number"
                placeholder="Price per night"
                value={tier.price}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].price = e.target.value;
                  setTiers(updated);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ---------------- GROOMING ---------------- */}
      {serviceType === "GROOMING" && (
        <div>
          <button
            onClick={addTier}
            className="bg-black text-white px-3 py-2 rounded"
          >
            Add Grooming Option
          </button>

          {tiers.map((tier, index) => (
            <div key={index} className="border p-3 mt-3 rounded space-y-2">
              <select
                value={tier.dogSize}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].dogSize = e.target.value;
                  setTiers(updated);
                }}
              >
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
              </select>

              <select
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].type = e.target.value;
                  setTiers(updated);
                }}
              >
                <option value="WASH">Wash & Brush</option>
                <option value="CUT">Wash & Cut</option>
              </select>

              <input
                type="number"
                placeholder="Price"
                value={tier.price}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].price = e.target.value;
                  setTiers(updated);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ---------------- TRANSPORT ---------------- */}
      {serviceType === "PET_TRANSPORT" && (
        <>
          <input
            type="number"
            placeholder="Average trip duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
          />

          <input
            type="number"
            placeholder="Base price (ZAR)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </>
      )}

      {/* ---------------- SAVE BUTTON ---------------- */}
      <button
        onClick={handleSave}
        className="bg-orange-500 text-white px-4 py-2 rounded w-full"
      >
        Save Service
      </button>
    </div>
  );
}

/* ---------------- UNIT MAPPER ---------------- */
function mapUnit(service: ServiceType) {
  switch (service) {
    case "WALKING":
    case "TRAINING":
      return "PER_SESSION";
    case "BOARDING":
      return "PER_NIGHT";
    case "GROOMING":
      return "PER_VISIT";
    case "PET_TRANSPORT":
      return "PER_TRIP";
    default:
      return "PER_SESSION";
  }
}