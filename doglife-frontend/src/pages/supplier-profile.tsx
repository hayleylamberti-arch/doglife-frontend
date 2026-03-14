import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatService(service: string) {
  const map: Record<string,string> = {
    WALKING: "🚶 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
    PET_SITTING: "🛏️ Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet"
  };

  return map[service] ?? service;
}

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
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p>Loading provider...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-red-600">Failed to load provider</p>
      </div>
    );
  }

  const supplier = data.supplier;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Provider Header */}

      <div className="grid md:grid-cols-3 gap-6">

        {/* Photo */}

        <div className="h-60 bg-gray-200 rounded-xl flex items-center justify-center text-5xl">
          🐶
        </div>

        {/* Provider Info */}

        <div className="md:col-span-2 space-y-3">

          <h1 className="text-3xl font-semibold">
            {supplier.businessName}
          </h1>

          <div className="text-yellow-500 text-sm">
            ⭐ 4.9 <span className="text-gray-500">(120 reviews)</span>
          </div>

          <p className="text-muted-foreground">
            📍 {supplier.suburb ?? "Unknown suburb"} {supplier.city ? `· ${supplier.city}` : ""}
          </p>

          <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            Book Service
          </button>

        </div>

      </div>

      {/* Services */}

      <div className="border rounded-xl p-6 bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Services Offered
        </h2>

        <div className="flex flex-wrap gap-2">

          {(supplier.serviceTypes || []).map((service: string) => (
            <span
              key={service}
              className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
            >
              {formatService(service)}
            </span>
          ))}

        </div>

      </div>

      {/* About */}

      <div className="border rounded-xl p-6 bg-white">

        <h2 className="text-lg font-semibold mb-2">
          About this provider
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {supplier.aboutServices || "This provider has not added a description yet."}
        </p>

      </div>

      {/* Contact */}

      <div className="border rounded-xl p-6 bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Contact
        </h2>

        {supplier.businessPhone && (
          <p className="text-sm">
            📞 {supplier.businessPhone}
          </p>
        )}

        {supplier.websiteUrl && (
          <p className="text-sm mt-1">
            🌐 {supplier.websiteUrl}
          </p>
        )}

      </div>

    </div>
  );
}