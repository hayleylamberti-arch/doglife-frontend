import { useParams } from "react-router-dom";
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

/* =========================
   COMPONENT
========================= */

export default function SupplierPublicProfile() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["publicSupplier", id],
    queryFn: async () => {
      const res = await api.get(`/api/public/suppliers/${id}`);
      return res.data.supplier;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6">Loading supplier...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-500">Supplier not found</div>;
  }

  const supplier = data;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* =========================
         HERO
      ========================= */}
      <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {supplier.businessName}
          </h1>

          <p className="text-gray-500 mt-1">
            {supplier.suburb}
          </p>

          <p className="text-sm text-gray-400 mt-1">
            ⭐⭐⭐⭐⭐ (Coming soon)
          </p>
        </div>

        <Button size="lg">
          Book Now
        </Button>
      </div>

      {/* =========================
         GALLERY
      ========================= */}
      {supplier.galleryUrls?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {supplier.galleryUrls.map((img: string, i: number) => (
            <img
              key={i}
              src={img}
              className="rounded-xl object-cover h-40 w-full"
            />
          ))}
        </div>
      )}

      {/* =========================
         ABOUT
      ========================= */}
      <Card>
        <CardContent className="p-6 space-y-2">
          <h2 className="text-xl font-semibold">About</h2>
          <p className="text-gray-600">
            {supplier.aboutServices || "No description provided yet."}
          </p>
        </CardContent>
      </Card>

      {/* =========================
         SERVICES
      ========================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>

        {supplier.services?.length > 0 ? (
          supplier.services.map((service: any) => (
            <Card key={service.id}>
              <CardContent className="p-6 space-y-3">

                <h3 className="text-lg font-semibold">
                  {service.service.replace(/_/g, " ")}
                </h3>

                {/* BASIC PRICE */}
                {service.baseRateCents > 0 && (
                  <p className="text-gray-700">
                    From {formatPrice(service.baseRateCents)}
                  </p>
                )}

                {/* GROOMING TIERS */}
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

                {/* CTA */}
                <Button size="sm">
                  Book Service
                </Button>

              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-400 text-sm">
            No services listed yet
          </p>
        )}
      </div>

    </div>
  );
}