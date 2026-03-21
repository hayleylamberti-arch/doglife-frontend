import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const res = await api.get(`/api/supplier/${id}`);
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="p-6">Loading provider...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-600">Failed to load provider</div>;
  }

  const supplier = data?.supplier ?? {};

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">

      <div className="grid md:grid-cols-3 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-5xl">
          🐶
        </div>

        <div className="md:col-span-2 space-y-3">
          <h1 className="text-3xl font-semibold">
            {supplier.businessName}
          </h1>

          <p className="text-muted-foreground">
            {supplier.suburb || "Unknown suburb"}
          </p>

          <div className="flex gap-3 pt-3">

            <Link
              to={`/book/${supplier.id}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 inline-block"
            >
              Book Service
            </Link>

            <button className="border px-6 py-3 rounded-md hover:bg-gray-50">
              Message
            </button>

          </div>
        </div>
      </div>

    </div>
  );
}