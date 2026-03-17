import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/suppliers"); // adjust if needed

      console.log("API RESPONSE:", res.data);

      // VERY IMPORTANT: handle different response shapes
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = suppliers.filter((s: any) =>
    (s.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold mb-6">
          Find Dog Services Near You
        </h1>

        <Card className="mb-8">
          <CardContent className="p-6 flex gap-4">
            <Input
              placeholder="Search for dog walkers, groomers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={fetchSuppliers}>
              Search
            </Button>
          </CardContent>
        </Card>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((service: any) => (
            <Card key={service.id} className="hover:shadow-lg transition">
              <CardContent className="p-6 space-y-3">

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {service.name || "No name"}
                  </h3>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    Verified
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  {service.description || "No description"}
                </p>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-yellow-500">★★★★★</span>

                  <Button size="sm">
                    View Provider
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No services found.
          </div>
        )}

      </div>
    </div>
  );
}