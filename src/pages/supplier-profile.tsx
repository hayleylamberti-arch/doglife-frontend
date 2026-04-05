import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mySupplierProfile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data.profile;
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-500">Supplier not found</div>;
  }

  const supplier = data;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          {supplier.businessName || "Your Business"}
        </h1>
        <p className="text-gray-500">
          {supplier.businessAddress || "No address added"}
        </p>
      </div>

      {/* ABOUT */}
      <div className="border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">About</h2>
        <p className="text-gray-600">
          {supplier.aboutServices || "No description yet"}
        </p>
      </div>

      {/* SERVICES */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>

        {supplier.services?.length === 0 && (
          <p className="text-gray-500">No services added yet</p>
        )}

        {supplier.services?.map((service: any) => (
          <div
            key={service.id}
            className="flex justify-between border p-3 rounded-lg"
          >
            <span>{service.service}</span>
            <span>R {service.baseRateCents / 100}</span>
          </div>
        ))}
      </div>

      {/* STATUS */}
      <div className="border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">Status</h2>

        <p className="text-sm">
          Approval:{" "}
          <span className="font-semibold">
            {supplier.approvalStatus}
          </span>
        </p>

        <p className="text-sm">
          Public:{" "}
          <span className="font-semibold">
            {supplier.isPublicVisible ? "Visible" : "Hidden"}
          </span>
        </p>
      </div>

    </div>
  );
}