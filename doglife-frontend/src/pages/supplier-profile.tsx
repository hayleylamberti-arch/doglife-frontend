import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import BookingModal from "@/components/booking-modal";
import { useState } from "react";

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
  const [showBooking, setShowBooking] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const res = await api.get(`/api/suppliers/${id}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p>Loading provider...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-red-600">Failed to load provider</p>
      </div>
    );
  }

  const supplier = data.supplier;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">

      {/* HEADER */}

      <div className="grid md:grid-cols-3 gap-6">

        {/* Provider Image */}

        <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-5xl">
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
            📍 {supplier.suburb ?? "Unknown suburb"}
            {supplier.city ? ` · ${supplier.city}` : ""}
          </p>

          {/* Trust signals */}

          <div className="text-sm text-gray-600 space-y-1">

            <div>✔ Verified provider</div>
            <div>✔ Responds quickly</div>

          </div>

          {/* Actions */}

          <div className="flex gap-3 pt-3">

  <button
    onClick={() => setShowBooking(true)}
    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
  >
    Book Service
  </button>

  <button className="border px-6 py-3 rounded-md hover:bg-gray-50">
    Message
  </button>

</div>

        </div>

      </div>

      {/* IMAGE GALLERY */}

      <div className="grid grid-cols-3 gap-4">

        <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
          🐾
        </div>

        <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
          🐕
        </div>

        <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
          🐶
        </div>

      </div>

      {/* SERVICES */}

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

      {/* ABOUT */}

      <div className="border rounded-xl p-6 bg-white">

        <h2 className="text-lg font-semibold mb-2">
          About this provider
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {supplier.aboutServices || "This provider has not added a description yet."}
        </p>

      </div>

      {/* PRICING */}

      <div className="border rounded-xl p-6 bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Pricing
        </h2>

        <p className="text-sm text-muted-foreground">
          Pricing information will appear here once services are configured.
        </p>

      </div>

      {/* AVAILABILITY */}

      <div className="border rounded-xl p-6 bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Availability
        </h2>

        <p className="text-sm text-muted-foreground">
          Availability calendar coming soon.
        </p>

      </div>

      {/* CONTACT */}

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

      {showBooking && (
  <BookingModal
    supplierId={supplier.id}
    onClose={() => setShowBooking(false)}
  />
)}

    </div>
  );
}