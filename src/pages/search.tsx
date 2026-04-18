import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatMoneyFromCents(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `R${Math.round(Number(value) / 100)}`;
}

function formatServiceLabel(value?: string) {
  if (!value) return "Service";
  return value.replace(/_/g, " ");
}

type SearchSupplierService = {
  id: string;
  service: string;
  unit?: string | null;
  baseRateCents?: number | null;
};

type SearchSupplier = {
  id: string;
  businessName: string;
  aboutServices?: string | null;
  suburb?: string | null;
  logoUrl?: string | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
  approvalStatus?: string | null;
  isVerified?: boolean;
  isPreferred?: boolean;
  startingPriceCents?: number | null;
  services?: SearchSupplierService[];
};

export default function SearchPage() {
  const [params] = useSearchParams();
  const location = params.get("location") || "";

  const [searchTerm, setSearchTerm] = useState(location);
  const [suppliers, setSuppliers] = useState<SearchSupplier[]>([]);
  const [savingSupplierId, setSavingSupplierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const fetchSuppliers = async (query?: string) => {
    try {
      setLoading(true);
      setError("");

      const searchValue = (query ?? searchTerm).trim();

      const res = await api.get(
        `/api/suppliers/location?suburb=${encodeURIComponent(searchValue)}`
      );

      const data = res.data?.suppliers ?? [];
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError("Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      setSearchTerm(location);
      fetchSuppliers(location);
      return;
    }

    fetchSuppliers();
  }, [location]);

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = suppliers.filter((supplier) => {
      if (!term) return true;

      const businessName = (supplier.businessName || "").toLowerCase();
      const aboutServices = (supplier.aboutServices || "").toLowerCase();
      const suburb = (supplier.suburb || "").toLowerCase();
      const services = Array.isArray(supplier.services)
        ? supplier.services
            .map((service) => String(service.service || ""))
            .join(" ")
            .toLowerCase()
        : "";

      return (
        businessName.includes(term) ||
        aboutServices.includes(term) ||
        suburb.includes(term) ||
        services.includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      const aPreferred = a.isPreferred ? 1 : 0;
      const bPreferred = b.isPreferred ? 1 : 0;

      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred;
      }

      return String(a.businessName || "").localeCompare(
        String(b.businessName || "")
      );
    });
  }, [suppliers, searchTerm]);

  const togglePreferredSupplier = async (supplier: SearchSupplier) => {
    try {
      setSavingSupplierId(supplier.id);

      if (supplier.isPreferred) {
        await api.delete(`/api/owner/preferred-suppliers/${supplier.id}`);
      } else {
        await api.post(`/api/owner/preferred-suppliers/${supplier.id}`);
      }

      setSuppliers((prev) =>
        prev.map((item) =>
          item.id === supplier.id
            ? { ...item, isPreferred: !item.isPreferred }
            : item
        )
      );
    } catch (err) {
      console.error("PREFERRED SUPPLIER ERROR:", err);
      alert("Failed to update preferred supplier");
    } finally {
      setSavingSupplierId(null);
    }
  };

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">
          {location ? `Dog Services in ${location}` : "Find Dog Services Near You"}
        </h1>

        <Card className="mb-8">
          <CardContent className="p-6 flex flex-col gap-4 md:flex-row">
            <Input
              placeholder="Search suburb or service (e.g. Sandton, grooming)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={() => fetchSuppliers()}>Search</Button>
          </CardContent>
        </Card>

        {loading && <p>Loading suppliers...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {supplier.logoUrl ? (
                      <img
                        src={supplier.logoUrl}
                        alt={supplier.businessName}
                        className="h-14 w-14 rounded-lg object-cover border border-gray-200"
                      />
                    ) : null}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {supplier.businessName || "Unnamed Business"}
                      </h3>

                      {supplier.suburb ? (
                        <p className="text-sm text-gray-500 mt-1">
                          {supplier.suburb}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => togglePreferredSupplier(supplier)}
                      disabled={savingSupplierId === supplier.id}
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded border transition ${
                        supplier.isPreferred
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-white text-gray-500 border-gray-300"
                      } disabled:opacity-50`}
                    >
                      <span>{supplier.isPreferred ? "♥" : "♡"}</span>
                      <span>
                        {savingSupplierId === supplier.id ? "Saving..." : "Preferred"}
                      </span>
                    </button>

                    {supplier.isVerified ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  {supplier.aboutServices || "No description provided"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {Array.isArray(supplier.services) && supplier.services.length > 0 ? (
                    supplier.services.slice(0, 3).map((service) => (
                      <span
                        key={service.id}
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wide"
                      >
                        {formatServiceLabel(service.service)}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs">No services listed</p>
                  )}
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {supplier.startingPriceCents != null
                        ? `From ${formatMoneyFromCents(
                            supplier.startingPriceCents
                          )}`
                        : "Price on profile"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {Number(supplier.ratingCount || 0) > 0
                        ? `${Number(supplier.ratingAverage || 0).toFixed(1)} ★ (${
                            supplier.ratingCount
                          })`
                        : "No ratings yet"}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
  navigate(`/supplier/${supplier.id}`, {
    state: { isPreferred: supplier.isPreferred },
  })
}
                  >
                    View Provider
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && filteredSuppliers.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No services found in this area yet.
          </div>
        )}
      </div>
    </div>
  );
}