import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {

  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const res = await api.get(`/api/suppliers/${id}`);
      return res.data;
    }
  });

  if (isLoading) {
    return <p>Loading provider...</p>;
  }

  if (error || !data) {
    return <p className="text-red-600">Failed to load provider</p>;
  }

  const supplier = data.supplier;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">

        <h1 className="text-2xl font-semibold">
          {supplier.businessName}
        </h1>

        <p className="text-sm text-muted-foreground">
          📍 {supplier.suburb} · {supplier.city}
        </p>

        <div className="mt-2 text-yellow-500">
          ⭐ 4.9 (120 reviews)
        </div>

        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Book Service
        </button>

      </div>

      {/* About */}
      <div className="border rounded-lg p-6 bg-white">

        <h2 className="text-lg font-semibold mb-2">
          About this provider
        </h2>

        <p className="text-sm text-muted-foreground">
          {supplier.aboutServices || "No description provided yet."}
        </p>

      </div>

      {/* Services */}
      <div className="border rounded-lg p-6 bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Services Offered
        </h2>

        <div className="flex flex-wrap gap-2">

          {(supplier.serviceTypes || []).map((service: string) => (
            <span
              key={service}
              className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
            >
              {service}
            </span>
          ))}

        </div>

      </div>

      {/* Contact */}
      <div className="border rounded-lg p-6 bg-white">

        <h2 className="text-lg font-semibold mb-2">
          Contact
        </h2>

        <p className="text-sm">
          📞 {supplier.businessPhone}
        </p>

        {supplier.websiteUrl && (
          <p className="text-sm mt-1">
            🌐 {supplier.websiteUrl}
          </p>
        )}

      </div>

    </div>
  );
}