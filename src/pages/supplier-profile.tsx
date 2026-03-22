import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["supplierProfile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data;
    },
  });

  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [aboutServices, setAboutServices] = useState("");

  useEffect(() => {
  if (data?.profile) {
    setBusinessName(data.profile.businessName || "");
    setBusinessAddress(data.profile.businessAddress || "");
    setAboutServices(data.profile.aboutServices || "");
  }
}, [data]);

 const mutation = useMutation({
  mutationFn: async (profileData: {
    businessName: string;
    businessAddress: string;
    aboutServices: string;
  }) => {
    const res = await api.post("/api/supplier/profile", profileData);
    return res.data;
  },
});

const handleSubmit = () => {
  mutation.mutate({
    businessName,
    businessAddress,
    aboutServices,
  });
};

  if (isLoading) {
    return <div className="p-6">Loading provider...</div>;
  }

  if (error || !data || !data.profile) {
    return (
      <div className="p-6 text-red-600">
        Failed to load provider
      </div>
    );
  }

  const supplier = data.profile;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Image */}
        <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-5xl">
          🐶
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-3">
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="text-3xl font-semibold border-none outline-none bg-transparent"
            placeholder="Business Name"
          />

          {/* ✅ FIXED FIELD */}
          <input
            type="text"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            className="text-muted-foreground border-none outline-none bg-transparent"
            placeholder="Business Address"
          />

          {/* ✅ ADD SERVICES */}
          <textarea
            value={aboutServices}
            onChange={(e) => setAboutServices(e.target.value)}
            className="text-sm border-none outline-none bg-transparent resize-none"
            placeholder="About Services"
            rows={3}
          />

          <div className="flex gap-3 pt-3">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}