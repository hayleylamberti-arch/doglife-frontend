import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import BookingModal from "@/components/booking-modal";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* =========================
   HELPERS
========================= */

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

type LocationState = {
  isPreferred?: boolean;
};

/* =========================
   COMPONENT
========================= */

export default function SupplierPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = (location.state || {}) as LocationState;

  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPreferred, setIsPreferred] = useState<boolean>(
    Boolean(locationState.isPreferred)
  );
  const [savingPreferred, setSavingPreferred] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["publicSupplier", id],
    queryFn: async () => {
      const res = await api.get(`/api/public/suppliers/${id}`);
      return res.data.supplier;
    },
    enabled: !!id,
  });

  useEffect(() => {
    setIsPreferred(Boolean(locationState.isPreferred));
  }, [locationState.isPreferred, id]);

  async function togglePreferredSupplier() {
    if (!id) return;

    try {
      setSavingPreferred(true);

      if (isPreferred) {
        await api.delete(`/api/owner/preferred-suppliers/${id}`);
        setIsPreferred(false);
      } else {
        await api.post(`/api/owner/preferred-suppliers/${id}`);
        setIsPreferred(true);
      }
    } catch (err) {
      console.error("PREFERRED SUPPLIER ERROR:", err);
      alert("Failed to update preferred supplier");
    } finally {
      setSavingPreferred(false);
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading supplier...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-500">Supplier not found</div>;
  }

  const supplier = data;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to search
        </button>

        <div className="flex gap-4 text-sm items-center">
          <button
            type="button"
            onClick={togglePreferredSupplier}
            disabled={savingPreferred}
            className={`inline-flex items-center gap-1 rounded border px-3 py-1 transition ${
              isPreferred
                ? "border-green-200 bg-green-100 text-green-700"
                : "border-gray-300 bg-white text-gray-500"
            } disabled:opacity-50`}
          >
            <span>{isPreferred ? "♥" : "♡"}</span>
            <span>{savingPreferred ? "Saving..." : "Preferred"}</span>
          </button>

          <button type="button">Share</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {supplier.logoUrl && (
            <img
              src={supplier.logoUrl}
              className="w-16 h-16 rounded-xl object-cover border"
              alt={supplier.businessName}
            />
          )}

          <div>
            <h1 className="text-3xl font-bold">{supplier.businessName}</h1>

            <p className="text-gray-500 mt-1">{supplier.suburb}</p>

            <p className="text-sm text-gray-400 mt-1">⭐⭐⭐⭐⭐ (Coming soon)</p>
          </div>
        </div>

        <Button size="lg">Book Now</Button>
      </div>

      {supplier.galleryUrls?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {supplier.galleryUrls.map((img: string, i: number) => (
            <img
              key={i}
              src={img}
              className="rounded-xl object-cover h-40 w-full"
              alt={`${supplier.businessName} gallery ${i + 1}`}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-2">
          <h2 className="text-xl font-semibold">About</h2>
          <p className="text-gray-600">
            {supplier.aboutServices || "No description provided yet."}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>

        {supplier.services?.length > 0 ? (
          supplier.services.map((service: any) => (
            <Card key={service.id}>
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold">
                  {service.service.replace(/_/g, " ")}
                </h3>

                {service.baseRateCents > 0 && (
                  <p className="text-gray-700">
                    From {formatPrice(service.baseRateCents)}
                  </p>
                )}

                {service.pricingTiers?.length > 0 && (
                  <div className="space-y-2 text-sm text-gray-600">
                    {["WASH_BRUSH", "WASH_CUT"].map((category) => {
                      const tiers = service.pricingTiers.filter(
                        (t: any) => t.category === category
                      );

                      if (tiers.length === 0) return null;

                      return (
                        <div key={category}>
                          <p className="font-medium">
                            {category === "WASH_BRUSH"
                              ? "Wash & Brush"
                              : "Wash & Cut"}
                          </p>

                          {tiers.map((t: any) => (
                            <p key={t.id}>
                              {t.dogSize?.toLowerCase()} — R{t.priceCents / 100}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedService(service);
                    setModalOpen(true);
                  }}
                >
                  Book Service
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-400 text-sm">No services listed yet</p>
        )}
      </div>

      {modalOpen && selectedService && (
        <BookingModal
          supplierId={supplier.id}
          service={selectedService}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}