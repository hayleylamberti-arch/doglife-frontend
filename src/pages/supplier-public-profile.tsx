import { useParams, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import BookingModal from "@/components/booking-modal";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function formatServiceName(value?: string) {
  return String(value || "SERVICE").replace(/_/g, " ");
}

function formatUnit(unit?: string | null) {
  switch (unit) {
    case "PER_NIGHT":
      return "per night";
    case "PER_SESSION":
      return "per session";
    case "PER_VISIT":
      return "per visit";
    case "PER_TRIP":
      return "per trip";
    case "PER_DAY":
      return "per day";
    case "PER_WALK":
      return "per walk";
    default:
      return "";
  }
}

function formatDogSize(value?: string | null) {
  if (!value) return "";
  return value.toLowerCase().replace(/^xl$/, "x large");
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function TrustBadge({
  label,
  variant = "green",
}: {
  label: string;
  variant?: "green" | "blue" | "gray";
}) {
  const styles =
    variant === "green"
      ? "border-green-200 bg-green-50 text-green-800"
      : variant === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : "border-gray-200 bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

type LocationState = {
  isPreferred?: boolean;
};

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

  const isApprovedSupplier = supplier.approvalStatus === "APPROVED";
  const isIdentityVerified = Boolean(supplier.identityVerified);
  const isFullyVerified =
    Boolean(supplier.identityVerified) &&
    (Boolean(supplier.backgroundCheckVerified) ||
      Boolean(supplier.premisesVerified));

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to search
        </button>

        <div className="flex items-center gap-4 text-sm">
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

      <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          {supplier.logoUrl && (
            <img
              src={supplier.logoUrl}
              className="h-16 w-16 rounded-xl border object-cover"
              alt={supplier.businessName}
            />
          )}

          <div>
            <h1 className="text-3xl font-bold">{supplier.businessName}</h1>
            <p className="mt-1 text-gray-500">{supplier.suburb || ""}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {isApprovedSupplier ? (
                <TrustBadge label="Approved Supplier" />
              ) : null}

              {isIdentityVerified ? (
                <TrustBadge label="Identity Verified" />
              ) : null}

              {isFullyVerified ? (
                <TrustBadge label="Fully Verified" variant="blue" />
              ) : null}

              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                {supplier.completedServicesCount ?? 0} completed
              </span>

              {Number(supplier.ratingCount || 0) > 0 ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  {Number(supplier.ratingAverage || 0).toFixed(1)} ★ (
                  {supplier.ratingCount})
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  No ratings yet
                </span>
              )}
            </div>

            <div className="mt-3">
              <Link
                to="/trust-and-safety"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                What do these trust levels mean?
              </Link>
            </div>
          </div>
        </div>

        <Button size="lg">Book Now</Button>
      </div>

      {supplier.galleryUrls?.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {supplier.galleryUrls.map((img: string, i: number) => (
            <img
              key={i}
              src={img}
              className="h-40 w-full rounded-xl object-cover"
              alt={`${supplier.businessName} gallery ${i + 1}`}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="text-xl font-semibold">Trust & Safety</h2>

          <div className="flex flex-wrap gap-2">
            {isApprovedSupplier ? (
              <TrustBadge label="Approved Supplier" />
            ) : (
              <TrustBadge label="Profile Under Review" variant="gray" />
            )}

            {isIdentityVerified ? (
              <TrustBadge label="Identity Verified" />
            ) : null}

            {isFullyVerified ? (
              <TrustBadge label="Fully Verified" variant="blue" />
            ) : null}
          </div>

          <p className="text-sm text-gray-600">
            DogLife verifies suppliers in layers. Some suppliers begin as
            Approved Suppliers and move up as additional checks are completed.
          </p>

          <Link
            to="/trust-and-safety"
            className="inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Learn how DogLife verifies suppliers
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="text-xl font-semibold">About</h2>
          <p className="text-gray-600">
            {supplier.aboutServices || "No description provided yet."}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>

        {supplier.services?.length > 0 ? (
          supplier.services.map((service: any) => {
            const hasGroomingTiers =
              Array.isArray(service.pricingTiers) &&
              service.pricingTiers.length > 0;

            const isDaycare = service.service === "DAYCARE";
            const isBoarding = service.service === "BOARDING";

            const halfDayPriceCents = toNumber(
              service?.pricingJson?.halfDayPriceCents
            );
            const fullDayPriceCents =
              toNumber(service?.pricingJson?.fullDayPriceCents) ||
              toNumber(service?.baseRateCents);

            const additionalDogPriceCents =
              toNumber(service?.additionalDogPriceCents) ||
              toNumber(service?.pricingJson?.additionalDogPriceCents) ||
              toNumber(service?.pricingJson?.additionalDogPrice);

            const hasAdditionalDogPrice = additionalDogPriceCents > 0;

            return (
              <Card key={service.id}>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                      {formatServiceName(service.service)}
                    </h3>

                    <div className="space-y-1 text-gray-700">
                      {isDaycare ? (
                        <>
                          <p>Half day: {formatPrice(halfDayPriceCents)}</p>
                          <p>Full day: {formatPrice(fullDayPriceCents)}</p>
                          {hasAdditionalDogPrice ? (
                            <p>
                              Extra dog: {formatPrice(additionalDogPriceCents)}
                            </p>
                          ) : null}
                          {service.maxDogsPerBooking ? (
                            <p>
                              Max dogs per booking: {service.maxDogsPerBooking}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {service.baseRateCents > 0 ? (
                            <p>
                              From {formatPrice(service.baseRateCents)}
                              {formatUnit(service.unit)
                                ? ` ${formatUnit(service.unit)}`
                                : ""}
                              {service.durationMinutes
                                ? ` • ${service.durationMinutes} mins`
                                : ""}
                            </p>
                          ) : service.durationMinutes ? (
                            <p>{service.durationMinutes} mins</p>
                          ) : null}

                          {isBoarding && hasAdditionalDogPrice ? (
                            <p>
                              Extra dog: {formatPrice(additionalDogPriceCents)}
                            </p>
                          ) : null}

                          {service.maxDogsPerBooking ? (
                            <p>
                              Max dogs per booking: {service.maxDogsPerBooking}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {hasGroomingTiers ? (
                    <div className="space-y-3 text-sm text-gray-700">
                      {["WASH_BRUSH", "WASH_CUT"].map((category) => {
                        const tiers = service.pricingTiers.filter(
                          (tier: any) => tier.category === category
                        );

                        if (tiers.length === 0) return null;

                        return (
                          <div key={category} className="space-y-1">
                            <p className="font-medium">
                              {category === "WASH_BRUSH"
                                ? "Wash & Brush"
                                : "Wash & Cut"}
                            </p>

                            {tiers.map((tier: any) => (
                              <p key={tier.id}>
                                {formatDogSize(tier.dogSize)} —{" "}
                                {formatPrice(tier.priceCents)}
                              </p>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

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
            );
          })
        ) : (
          <p className="text-sm text-gray-400">No services listed yet</p>
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