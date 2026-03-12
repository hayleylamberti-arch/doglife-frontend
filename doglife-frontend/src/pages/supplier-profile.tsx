import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface SupplierProfile {
  userId: string;
  businessName: string;
  aboutServices?: string;
  suburb?: string;
  city?: string;
  province?: string;
  websiteUrl?: string;
  profileImageUrl?: string;
}

export default function SupplierProfilePage() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/suppliers/${id}`);
      return data as SupplierProfile;
    },
  });

  if (isLoading) {
    return <p className="p-6">Loading supplier...</p>;
  }

  if (error || !data) {
    return <p className="p-6 text-red-600">Failed to load supplier</p>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">

      {/* Provider Header */}
      <div className="border rounded-xl p-6 bg-white shadow-sm flex gap-6 items-center">

        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
          {data.profileImageUrl ? (
            <img
              src={data.profileImageUrl}
              alt={data.businessName}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            "🐶"
          )}
        </div>

        <div className="flex-1">

          <h1 className="text-3xl font-semibold">
            {data.businessName}
          </h1>

          <p className="text-muted-foreground mt-1">
            📍 {data.suburb ?? ""} {data.city ?? ""}
          </p>

          {data.websiteUrl && (
            <p className="text-blue-600 mt-1">
              {data.websiteUrl}
            </p>
          )}

          <div className="flex gap-3 mt-4">

            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Contact Provider
            </button>

            <button className="border px-4 py-2 rounded-md">
              Book Service
            </button>

          </div>

        </div>
      </div>

      {/* About Section */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">

        <h2 className="text-xl font-semibold mb-2">
          About This Provider
        </h2>

        <p className="text-muted-foreground">
          {data.aboutServices || "This provider has not added a description yet."}
        </p>

      </div>

      {/* Services Section */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">

        <h2 className="text-xl font-semibold mb-4">
          Services Offered
        </h2>

        <ul className="grid grid-cols-2 gap-3">

          <li className="border rounded p-3">Dog Walking</li>
          <li className="border rounded p-3">Boarding</li>
          <li className="border rounded p-3">Training</li>
          <li className="border rounded p-3">Pet Sitting</li>

        </ul>

      </div>

      {/* Reviews Section */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">

        <h2 className="text-xl font-semibold mb-4">
          Reviews
        </h2>

        <p className="text-muted-foreground">
          Reviews will appear here once customers start leaving feedback.
        </p>

      </div>

    </div>
  );
}