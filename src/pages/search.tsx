import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [params] = useSearchParams();
  const location = params.get("location") || "";

  const [searchTerm, setSearchTerm] = useState(location);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /* ================================
     FETCH SUPPLIERS
  ================================ */

  const fetchSuppliers = async (query?: string) => {
    try {
      setLoading(true);
      setError("");

      const searchValue = query ?? searchTerm;

      const res = await api.get(
  `/api/suppliers/location?suburb=${encodeURIComponent(searchValue)}`
);

      const data = res.data?.suppliers ?? res.data ?? [];

      setSuppliers(data);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     INITIAL LOAD (from URL)
  ================================ */

  useEffect(() => {
    if (location) {
      setSearchTerm(location);
      fetchSuppliers(location);
    } else {
      fetchSuppliers();
    }
  }, [location]);

  /* ================================
     FILTER (CLIENT SIDE)
  ================================ */

  const filtered = suppliers
    .filter((s: any) => s?.businessName)
    .filter((s: any) =>
      (s.businessName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  /* ================================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-6">
          {location
            ? `Dog Services in ${location}`
            : "Find Dog Services Near You"}
        </h1>

        {/* SEARCH BAR */}
        <Card className="mb-8">
          <CardContent className="p-6 flex gap-4">
            <Input
              placeholder="Search suburb or service (e.g. Sandton, grooming)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={() => fetchSuppliers()}>
              Search
            </Button>
          </CardContent>
        </Card>

        {/* STATES */}
        {loading && <p>Loading suppliers...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* RESULTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((supplier: any) => (
            <Card key={supplier.id} className="hover:shadow-lg transition">
              <CardContent className="p-6 space-y-3">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {supplier.businessName || "Unnamed Business"}
                  </h3>

                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Verified
                  </span>
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm text-gray-600">
                  {supplier.description ||
                    supplier.aboutServices ||
                    "No description provided"}
                </p>

                {/* SERVICES */}
                <div className="text-sm text-gray-700">
                  {supplier.services?.length > 0 ? (
                    supplier.services.map((s: any) => (
                      <p key={s.id}>
                        {s.serviceType?.replace(/_/g, " ")} · R{s.basePrice}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs">
                      No services listed
                    </p>
                  )}
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-yellow-500 text-sm">★★★★★</span>

                 <Button
  size="sm"
  onClick={() => navigate(`/supplier/${supplier.id}`)}
>
  View Provider
</Button> 
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* EMPTY STATE */}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No services found in this area yet.
          </div>
        )}

      </div>
    </div>
  );
}