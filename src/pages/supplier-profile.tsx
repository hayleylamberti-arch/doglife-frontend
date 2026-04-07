import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ================================
   SUBURBS (TEMP STATIC)
================================ */

const SUBURBS = [
  { id: "1", name: "Bryanston" },
  { id: "2", name: "Sandton" },
  { id: "3", name: "Fourways" },
  { id: "4", name: "Rosebank" },
];

/* ================================
   COMPONENT
================================ */

export default function SupplierProfilePage() {

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplierProfile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data.profile;
    },
  });

  /* ================================
     STATE
  ================================ */

  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [aboutServices, setAboutServices] = useState("");
  const [suburbId, setSuburbId] = useState("");

  /* ================================
     LOAD DATA (🔥 FIXED)
  ================================ */

  useEffect(() => {
    if (supplier) {
      setBusinessName(supplier.businessName || "");
      setBusinessAddress(supplier.businessAddress || "");
      setAboutServices(supplier.aboutServices || "");

      // ✅ FIX: use "suburb" not "suburbId"
      setSuburbId(supplier.suburb || "");
    }
  }, [supplier]);

  /* ================================
     SAVE PROFILE
  ================================ */

  const saveProfile = useMutation({
    mutationFn: async (payload: any) => {
      return api.patch("/api/supplier/profile", payload);
    },
    onSuccess: () => alert("✅ Saved"),
    onError: () => alert("❌ Failed to save"),
  });

  /* ================================
     UI STATES
  ================================ */

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!supplier) return <div className="p-6">Not found</div>;

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      <h1 className="text-3xl font-bold">Business Profile</h1>

      {/* ================================
         BUSINESS DETAILS
      ================================ */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="font-semibold">Business Details</h2>

        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business Name"
          className="w-full border p-3 rounded"
        />

        <input
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="Address"
          className="w-full border p-3 rounded"
        />

        {/* 🏡 SUBURB */}
        <select
          value={suburbId}
          onChange={(e) => setSuburbId(e.target.value)}
          className="w-full border p-3 rounded"
        >
          <option value="">Select Suburb</option>
          {SUBURBS.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            saveProfile.mutate({
              businessName,
              businessAddress,
              suburb: suburbId, // ✅ CORRECT
            })
          }
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Details
        </button>

      </div>

      {/* ================================
         ABOUT
      ================================ */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="font-semibold">About</h2>

        <textarea
          value={aboutServices}
          onChange={(e) => setAboutServices(e.target.value)}
          className="w-full border p-3 rounded min-h-[120px]"
        />

        <button
          onClick={() =>
            saveProfile.mutate({
              aboutServices,
            })
          }
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Description
        </button>

      </div>

    </div>
  );
}