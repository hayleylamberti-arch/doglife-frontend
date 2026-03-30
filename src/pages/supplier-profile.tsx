import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {
  const { id } = useParams();
  const isPublicView = Boolean(id);

  /* ================================
     FETCH PROFILE
  ================================ */

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["supplierProfile", id],
    queryFn: async () => {
      if (isPublicView) {
        const res = await api.get(`/api/public/suppliers/${id}`);
        return res.data;
      } else {
        const res = await api.get("/api/supplier/profile");
        return res.data;
      }
    },
  });

  /* ================================
     FETCH DOGS (PUBLIC ONLY)
  ================================ */

  const { data: dogsData } = useQuery({
    queryKey: ["owner-dogs"],
    enabled: isPublicView,
    queryFn: async () => {
      const res = await api.get("/api/owner/dogs");
      return res.data;
    },
  });

  const dogs = dogsData?.dogs ?? [];

  console.log("PROFILE RESPONSE:", data);

  const supplier = isPublicView ? data?.supplier : data?.profile;
  const services = supplier?.services ?? [];

  /* ================================
     EDIT PROFILE STATE
  ================================ */

  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    description: "",
    website: "",
    address: "",
    contactPhone: "",
  });

  /* ================================
     SAFE FORM SYNC (FIXED)
  ================================ */

  useEffect(() => {
    if (!supplier) return;

    setForm({
      businessName: supplier.businessName || "",
      description: supplier.aboutServices || "",
      website: supplier.websiteUrl || "",
      address: supplier.businessAddress || "",
      contactPhone: supplier.businessPhone || "",
    });

  }, [supplier?.id]); // ✅ prevents reset bug

  /* ================================
     PROFILE SAVE (FIXED)
  ================================ */

  const updateMutation = useMutation({
    mutationFn: async () => {

      const payload = {
        businessName: form.businessName,
        aboutServices: form.description,
        websiteUrl: form.website,
        businessAddress: form.address,
        businessPhone: form.contactPhone,
        suburbId: null,
      };

      console.log("🚀 SENDING PROFILE UPDATE:", payload);

      const res = await api.patch("/api/supplier/profile", payload);

      console.log("✅ RESPONSE:", res.data);

      return res.data;
    },

    onSuccess: () => {
      alert("Profile updated ✅");
      setIsEditing(false);
      refetch();
    },

    onError: (err: any) => {
      console.error("❌ UPDATE FAILED:", err?.response?.data || err);
      alert(err?.response?.data?.error || "Update failed");
    }
  });

  /* ================================
     SERVICES STATE (UI ONLY FOR NOW)
  ================================ */

  const [servicesForm, setServicesForm] = useState([
    { service: "", unit: "PER_HOUR", baseRateCents: "", durationMinutes: "" }
  ]);

  /* ================================
     AVAILABILITY STATE
  ================================ */

  const [availabilityForm, setAvailabilityForm] = useState([
    { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" }
  ]);

  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/supplier/availability", {
        availability: availabilityForm
      });
    },
    onSuccess: () => {
      alert("Availability saved ✅ 🎉");
      refetch();
    },
  });

  /* ================================
     BOOKING (PUBLIC)
  ================================ */

  const [selectedService, setSelectedService] = useState("");
  const [selectedDog, setSelectedDog] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState("");

  const bookingMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/bookings", {
        supplierServiceId: selectedService,
        dogIds: [selectedDog],
        startAt: new Date(selectedDateTime).toISOString(),
      });
    },
    onSuccess: () => alert("Booking requested ✅"),
  });

  /* ================================
     LOADING
  ================================ */

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!supplier) return <div className="p-6">Not found</div>;

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-start">

        <div>
          <h1 className="text-3xl font-bold">
            {supplier.businessName}
          </h1>
          <p className="text-gray-500">
            {supplier.businessAddress}
          </p>
        </div>

        {!isPublicView && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="border px-4 py-2 rounded"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        )}
      </div>

      {/* ONBOARDING */}
      {!isPublicView && (
        <div className="bg-blue-50 border p-4 rounded">
          Onboarding Step: {supplier?.user?.onboardingStep || 1} / 3
        </div>
      )}

      {/* EDIT PROFILE */}
      {!isPublicView && isEditing && (
        <div className="border p-6 rounded space-y-4">

          <input
            placeholder="Business Name"
            className="border p-2 w-full"
            value={form.businessName}
            onChange={(e) =>
              setForm({ ...form, businessName: e.target.value })
            }
          />

          <textarea
            placeholder="About services"
            className="border p-2 w-full"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            placeholder="Website"
            className="border p-2 w-full"
            value={form.website}
            onChange={(e) =>
              setForm({ ...form, website: e.target.value })
            }
          />

          <input
            placeholder="Address"
            className="border p-2 w-full"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          <input
            placeholder="Phone"
            className="border p-2 w-full"
            value={form.contactPhone}
            onChange={(e) =>
              setForm({ ...form, contactPhone: e.target.value })
            }
          />

          <button
            onClick={() => updateMutation.mutate()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* SERVICES */}
      {!isPublicView && (
        <div className="border p-6 rounded space-y-4">

          <h2 className="text-xl font-semibold">Services</h2>

          {servicesForm.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                placeholder="Service"
                className="border p-2"
                value={s.service}
                onChange={(e) => {
                  const updated = [...servicesForm];
                  updated[i].service = e.target.value;
                  setServicesForm(updated);
                }}
              />
              <input
                placeholder="Price (R)"
                className="border p-2"
                value={s.baseRateCents}
                onChange={(e) => {
                  const updated = [...servicesForm];
                  updated[i].baseRateCents = e.target.value;
                  setServicesForm(updated);
                }}
              />
            </div>
          ))}

          <button
            onClick={() =>
              setServicesForm([
                ...servicesForm,
                { service: "", unit: "PER_HOUR", baseRateCents: "", durationMinutes: "" }
              ])
            }
            className="border px-3 py-1 rounded"
          >
            + Add Service
          </button>

          <button className="bg-gray-400 text-white px-4 py-2 rounded">
            Save Services (Next Step)
          </button>
        </div>
      )}

      {/* AVAILABILITY */}
      {!isPublicView && (
        <div className="border p-6 rounded space-y-4">

          <h2 className="text-xl font-semibold">Availability</h2>

          {availabilityForm.map((slot, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">

              <select
                value={slot.dayOfWeek}
                onChange={(e) => {
                  const updated = [...availabilityForm];
                  updated[i].dayOfWeek = Number(e.target.value);
                  setAvailabilityForm(updated);
                }}
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>

              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => {
                  const updated = [...availabilityForm];
                  updated[i].startTime = e.target.value;
                  setAvailabilityForm(updated);
                }}
              />

              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => {
                  const updated = [...availabilityForm];
                  updated[i].endTime = e.target.value;
                  setAvailabilityForm(updated);
                }}
              />

            </div>
          ))}

          <button
            onClick={() =>
              setAvailabilityForm([
                ...availabilityForm,
                { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" }
              ])
            }
            className="border px-3 py-1 rounded"
          >
            + Add Slot
          </button>

          <button
            onClick={() => saveAvailabilityMutation.mutate()}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save Availability
          </button>

        </div>
      )}

    </div>
  );
}