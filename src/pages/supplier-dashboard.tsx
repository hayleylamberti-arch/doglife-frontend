import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ServiceType =
  | "WALKING"
  | "TRAINING"
  | "GROOMING"
  | "BOARDING"
  | "PET_TRANSPORT";

export default function SupplierDashboard() {
  const [service, setService] = useState<ServiceType>("WALKING");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [groomingType, setGroomingType] = useState("WASH");
  const [dogSize, setDogSize] = useState("MEDIUM");

  const [savedServices, setSavedServices] = useState<any[]>([]);

  /* ---------------- FETCH ---------------- */
  const fetchServices = async () => {
    try {
      const res = await api.get("/api/supplier/profile");
      const services = res.data?.profile?.services || [];
      setSavedServices(services);
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ---------------- SAVE ---------------- */
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

      fetchServices();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save service");
    }
  };

  /* ---------------- GROUP SERVICES ---------------- */
  const groupedServices = savedServices.reduce((acc: any, s: any) => {
    if (!acc[s.service]) acc[s.service] = [];
    acc[s.service].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">

      {/* ---------------- FORM ---------------- */}
      <div className="space-y-4 bg-white p-6 rounded-xl shadow">

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

        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">R</span>
          <input
            type="number"
            className="w-full border p-2 pl-8 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-orange-500 text-white py-2 rounded"
        >
          Save Service
        </button>
      </div>

      {/* ---------------- SERVICES ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Your Services</h2>

        {savedServices.length === 0 ? (
          <p className="text-gray-500">No services added yet</p>
        ) : (
          <div className="space-y-4">

            {Object.entries(groupedServices).map(([serviceName, list]: any) => (
              <div key={serviceName} className="space-y-2">

                <h3 className="font-semibold">{serviceName}</h3>

                {list.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex justify-between border p-3 rounded"
                  >
                    <div>

                      {s.durationMinutes && (
                        <p className="text-sm text-gray-500">
                          {s.durationMinutes} mins
                        </p>
                      )}

                      {s.groomingOptions?.groomingType && (
                        <p className="text-sm text-gray-500">
                          {s.groomingOptions.groomingType}
                        </p>
                      )}

                    </div>

                    <span className="font-semibold">
                      R {s.baseRateCents / 100}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
}