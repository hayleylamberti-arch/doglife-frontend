import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatMoneyFromCents(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `R${Math.round(Number(value) / 100)}`;
}

type SearchMode = "AREA" | "AVAILABLE";

type SuburbResult = {
  id: string;
  suburbName: string;
  city: string;
  province: string;
};

type SearchSupplier = {
  id: string;
  businessName: string;
  aboutServices?: string | null;
  suburb?: string | null;
  logoUrl?: string | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
  completedServicesCount?: number | null;
  isVerified?: boolean;
  isPreferred?: boolean;
  usedBefore?: boolean;
  startingPriceCents?: number | null;
  available?: boolean;
};

const VALID_SERVICES = [
  "GROOMING",
  "BOARDING",
  "DAYCARE",
  "WALKING",
  "TRAINING",
  "PET_SITTING",
  "PET_TRANSPORT",
  "MOBILE_VET",
] as const;

function isValidService(value: string | null): value is (typeof VALID_SERVICES)[number] {
  return Boolean(value && VALID_SERVICES.includes(value as (typeof VALID_SERVICES)[number]));
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const serviceFromUrl = params.get("service");
  const locationFromUrl = params.get("location") || "";

  const initialService = isValidService(serviceFromUrl) ? serviceFromUrl : "GROOMING";
  const openedFromShortcut = isValidService(serviceFromUrl);

  const [searchMode, setSearchMode] = useState<SearchMode>(
    openedFromShortcut ? "AREA" : "AREA"
  );
  const [suburb, setSuburb] = useState(locationFromUrl);
  const [suburbQuery, setSuburbQuery] = useState(locationFromUrl);
  const [suburbResults, setSuburbResults] = useState<SuburbResult[]>([]);
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false);

  const [service, setService] = useState(initialService);
  const [groomingCategory, setGroomingCategory] = useState("WASH_BRUSH");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  const [suppliers, setSuppliers] = useState<SearchSupplier[]>([]);
  const [savingSupplierId, setSavingSupplierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ownerProfileLoaded, setOwnerProfileLoaded] = useState(false);
  const [autoLoadedShortcutResults, setAutoLoadedShortcutResults] = useState(false);

  const selectedServiceLabel = useMemo(() => {
    return service
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [service]);

  const searchSuburbs = async (value: string) => {
    setSuburbQuery(value);
    setSuburb(value);

    if (value.trim().length < 2) {
      setSuburbResults([]);
      setShowSuburbDropdown(false);
      return;
    }

    try {
      const res = await api.get(
        `/api/suburbs/search?q=${encodeURIComponent(value.trim())}`
      );

      const results = res.data?.suburbs ?? [];
      setSuburbResults(Array.isArray(results) ? results : []);
      setShowSuburbDropdown(true);
    } catch (err) {
      console.error("SUBURB SEARCH ERROR:", err);
      setSuburbResults([]);
    }
  };

  const fetchAreaSuppliers = async (selectedSuburb: string, selectedService?: string) => {
    const query = new URLSearchParams({
      suburb: selectedSuburb.trim(),
    });

    if (selectedService) {
      query.set("service", selectedService);
    }

    const res = await api.get(`/api/suppliers/search?${query.toString()}`);
    const data = res.data?.suppliers ?? [];
    setSuppliers(Array.isArray(data) ? data : []);
  };

  const fetchAvailabilitySuppliers = async () => {
    const query = new URLSearchParams({
      suburb: suburb.trim(),
      service,
      date,
      time,
    });

    if (service === "GROOMING") {
      query.set("groomingCategory", groomingCategory);
    }

    const res = await api.get(`/api/suppliers/search?${query.toString()}`);
    const data = res.data?.suppliers ?? [];
    setSuppliers(Array.isArray(data) ? data : []);
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");
      setShowSuburbDropdown(false);

      if (!suburb.trim()) {
        setError("Please enter a suburb.");
        setSuppliers([]);
        return;
      }

      if (searchMode === "AREA") {
        await fetchAreaSuppliers(suburb, service || undefined);
        return;
      }

      if (!service || !date || !time) {
        setError("Please choose service, date and time.");
        setSuppliers([]);
        return;
      }

      await fetchAvailabilitySuppliers();
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError("Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerDefaults() {
      try {
        const res = await api.get("/api/owner/profile");
        const profile = res.data?.profile;

        const profileSuburb =
          typeof profile?.suburb === "string" && profile.suburb.trim()
            ? profile.suburb.trim()
            : "";

        if (!cancelled && !suburb.trim() && profileSuburb) {
          setSuburb(profileSuburb);
          setSuburbQuery(profileSuburb);
        }
      } catch (err) {
        console.error("OWNER PROFILE LOAD ERROR:", err);
      } finally {
        if (!cancelled) {
          setOwnerProfileLoaded(true);
        }
      }
    }

    loadOwnerDefaults();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openedFromShortcut) return;
    if (!ownerProfileLoaded) return;
    if (autoLoadedShortcutResults) return;

    if (!suburb.trim()) {
      setError("Please select your suburb to view providers for this service.");
      setSuppliers([]);
      return;
    }

    const runAutoSearch = async () => {
      try {
        setLoading(true);
        setError("");
        await fetchAreaSuppliers(suburb, service);
        setAutoLoadedShortcutResults(true);
      } catch (err) {
        console.error("SHORTCUT AUTO SEARCH ERROR:", err);
        setError("Failed to load suppliers");
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    runAutoSearch();
  }, [
    openedFromShortcut,
    ownerProfileLoaded,
    autoLoadedShortcutResults,
    suburb,
    service,
  ]);

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Find Dog Services</h1>

        <Card className="mb-8">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-5 flex flex-wrap gap-3">
              <Button
                type="button"
                variant={searchMode === "AREA" ? "default" : "outline"}
                onClick={() => setSearchMode("AREA")}
              >
                Search by suburb
              </Button>

              <Button
                type="button"
                variant={searchMode === "AVAILABLE" ? "default" : "outline"}
                onClick={() => setSearchMode("AVAILABLE")}
              >
                Search availability
              </Button>
            </div>

            {openedFromShortcut ? (
              <div className="md:col-span-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {suburb.trim() ? (
                  <>
                    Showing <span className="font-semibold">{selectedServiceLabel}</span>{" "}
                    providers in <span className="font-semibold">{suburb}</span>, with preferred providers first.
                  </>
                ) : (
                  <>
                    Select your suburb to view <span className="font-semibold">{selectedServiceLabel}</span>{" "}
                    providers near you.
                  </>
                )}
              </div>
            ) : null}

            <div className="relative">
              <Input
                placeholder="Suburb e.g. Fourways"
                value={suburbQuery}
                onChange={(e) => searchSuburbs(e.target.value)}
                onFocus={() => {
                  if (suburbResults.length > 0) setShowSuburbDropdown(true);
                }}
              />

              {showSuburbDropdown && suburbResults.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg overflow-hidden">
                  {suburbResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setSuburb(item.suburbName);
                        setSuburbQuery(item.suburbName);
                        setSuburbResults([]);
                        setShowSuburbDropdown(false);
                      }}
                    >
                      <span className="font-medium">{item.suburbName}</span>
                      <span className="text-gray-500">, {item.city}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <select
              value={service}
              onChange={(e) => setService(e.target.value as (typeof VALID_SERVICES)[number])}
              className="border rounded-md px-3 py-2 bg-white"
            >
              <option value="GROOMING">Grooming</option>
              <option value="BOARDING">Boarding</option>
              <option value="DAYCARE">Daycare</option>
              <option value="WALKING">Walking</option>
              <option value="TRAINING">Training</option>
              <option value="PET_SITTING">Pet Sitting</option>
              <option value="PET_TRANSPORT">Pet Transport</option>
              <option value="MOBILE_VET">Mobile Vet</option>
            </select>

            {searchMode === "AVAILABLE" ? (
              <>
                {service === "GROOMING" ? (
                  <select
                    value={groomingCategory}
                    onChange={(e) => setGroomingCategory(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-white"
                  >
                    <option value="WASH_BRUSH">Wash & Brush</option>
                    <option value="WASH_CUT">Wash & Cut</option>
                  </select>
                ) : (
                  <div />
                )}

                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />

                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </>
            ) : (
              <>
                <div />
                <div />
                <div />
              </>
            )}

            <div className="md:col-span-5">
              <Button onClick={fetchSuppliers}>
                {searchMode === "AVAILABLE" ? "Check availability" : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? <p>Loading suppliers...</p> : null}
        {error ? <p className="text-red-500">{error}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.map((supplier) => (
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

                      <div className="flex gap-2 mt-2 flex-wrap">
                        {supplier.isPreferred ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Preferred
                          </span>
                        ) : null}

                        {supplier.usedBefore ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Used before
                          </span>
                        ) : null}

                        {searchMode === "AVAILABLE" && supplier.available ? (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Available
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePreferredSupplier(supplier)}
                    disabled={savingSupplierId === supplier.id}
                    className={`text-xs px-3 py-1 rounded border ${
                      supplier.isPreferred
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-white text-gray-500 border-gray-300"
                    } disabled:opacity-50`}
                  >
                    {savingSupplierId === supplier.id
                      ? "Saving..."
                      : supplier.isPreferred
                      ? "♥ Preferred"
                      : "♡ Preferred"}
                  </button>
                </div>

                <p className="text-sm text-gray-600">
                  {supplier.aboutServices || "No description provided"}
                </p>

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {supplier.startingPriceCents != null
                        ? `From ${formatMoneyFromCents(supplier.startingPriceCents)}`
                        : "Price on profile"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {Number(supplier.ratingCount || 0) > 0
                        ? `${Number(supplier.ratingAverage || 0).toFixed(1)} ★ (${supplier.ratingCount})`
                        : "No ratings yet"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {(supplier.completedServicesCount ?? 0)} completed services
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(`/supplier/${supplier.id}`, {
                        state: {
                          isPreferred: supplier.isPreferred,
                          selectedService: service,
                          groomingCategory:
                            searchMode === "AVAILABLE" ? groomingCategory : null,
                          date: searchMode === "AVAILABLE" ? date : null,
                          time: searchMode === "AVAILABLE" ? time : null,
                        },
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

        {!loading && suppliers.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            {searchMode === "AVAILABLE"
              ? "No available providers found for this search."
              : `No ${selectedServiceLabel.toLowerCase()} providers found in this area yet.`}
          </div>
        ) : null}
      </div>
    </div>
  );
}