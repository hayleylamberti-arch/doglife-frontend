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

type ValidService = (typeof VALID_SERVICES)[number];

const SERVICE_LABELS: Record<ValidService, string> = {
  GROOMING: "Grooming",
  BOARDING: "Boarding",
  DAYCARE: "Daycare",
  WALKING: "Walking",
  TRAINING: "Training",
  PET_SITTING: "Pet Sitting",
  PET_TRANSPORT: "Pet Transport",
  MOBILE_VET: "Mobile Vet",
};

function isValidService(value: string | null): value is ValidService {
  return Boolean(value && VALID_SERVICES.includes(value as ValidService));
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const serviceFromUrl = params.get("service");
  const suburbFromUrl = params.get("suburb") || params.get("location") || "";

  const initialService = isValidService(serviceFromUrl) ? serviceFromUrl : "";
  const openedFromShortcut = isValidService(serviceFromUrl);

  const [searchMode, setSearchMode] = useState<SearchMode>(
    openedFromShortcut ? "AREA" : "AREA"
  );
  const [suburb, setSuburb] = useState(suburbFromUrl);
  const [suburbQuery, setSuburbQuery] = useState(suburbFromUrl);
  const [suburbResults, setSuburbResults] = useState<SuburbResult[]>([]);
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false);

  const [service, setService] = useState<ValidService | "">(initialService);
  const [availableServices, setAvailableServices] = useState<ValidService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

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
  return service ? SERVICE_LABELS[service] : "All services";
}, [service]);

  const serviceOptions = useMemo(() => {
    if (!suburb.trim()) {
      return VALID_SERVICES.map((value) => ({
        value,
        label: SERVICE_LABELS[value],
      }));
    }

    return availableServices.map((value) => ({
      value,
      label: SERVICE_LABELS[value],
    }));
  }, [availableServices, suburb]);

  const hasLiveServicesForSuburb = !suburb.trim() || availableServices.length > 0;

  const searchSuburbs = async (value: string) => {
    setSuburbQuery(value);
    setSuburb(value);

    if (value.trim().length < 2) {
      setSuburbResults([]);
      setShowSuburbDropdown(false);
      setAvailableServices([]);
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

  const fetchLiveServices = async (selectedSuburb: string) => {
    const trimmedSuburb = selectedSuburb.trim();

    if (!trimmedSuburb) {
      setAvailableServices([]);
      return;
    }

    try {
      setServicesLoading(true);

      const res = await api.get(
        `/api/suburbs/${encodeURIComponent(trimmedSuburb)}/services`
      );

      const payload = res.data?.services ?? [];
      const nextServices = Array.isArray(payload)
        ? payload.filter((item): item is ValidService => isValidService(item))
        : [];

      setAvailableServices(nextServices);

      if (service && nextServices.length > 0 && !nextServices.includes(service)) {
  setService(nextServices[0]);
}
    } catch (err) {
      console.error("LIVE SERVICES LOAD ERROR:", err);
      setAvailableServices([]);
    } finally {
      setServicesLoading(false);
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
      service: service || "GROOMING",
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

      if (service && availableServices.length === 0) {
        setError("No live services are available in this suburb yet.");
        setSuppliers([]);
        return;
      }

      if (service && !availableServices.includes(service)) {
        setError("That service is not available in this suburb yet.");
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
    if (!suburb.trim()) {
      setAvailableServices([]);
      return;
    }

    fetchLiveServices(suburb);
  }, [suburb]);

  useEffect(() => {
    if (!openedFromShortcut) return;
    if (!ownerProfileLoaded) return;
    if (autoLoadedShortcutResults) return;
    if (servicesLoading) return;

    if (!suburb.trim()) {
      setError("Please select your suburb to view providers for this service.");
      setSuppliers([]);
      return;
    }

    if (availableServices.length === 0) {
      setError("No live services are available in this suburb yet.");
      setSuppliers([]);
      return;
    }

    const serviceToSearch =
  service && availableServices.includes(service) ? service : availableServices[0];

    const runAutoSearch = async () => {
      try {
        setLoading(true);
        setError("");
        await fetchAreaSuppliers(suburb, serviceToSearch);
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
    availableServices,
    servicesLoading,
  ]);

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">Find Dog Services</h1>

        <Card className="mb-8">
          <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-5">
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
                    providers in <span className="font-semibold">{suburb}</span>, with preferred
                    providers first.
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
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
                  {suburbResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
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
              onChange={async (e) => {
  const nextService = e.target.value as ValidService;
  setService(nextService);

  if (searchMode === "AREA" && suburb.trim()) {
    try {
      setLoading(true);
      setError("");
      setShowSuburbDropdown(false);
      await fetchAreaSuppliers(suburb, nextService);
    } catch (err) {
      console.error("SERVICE AUTO SEARCH ERROR:", err);
      setError("Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }
}}
              className="rounded-md border bg-white px-3 py-2"
              disabled={!hasLiveServicesForSuburb || servicesLoading}
            >
              {!suburb.trim() ? (
                VALID_SERVICES.map((value) => (
                  <option key={value} value={value}>
                    {SERVICE_LABELS[value]}
                  </option>
                ))
              ) : serviceOptions.length > 0 ? (
                serviceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))
              ) : (
                <option value="">No live services in this suburb yet</option>
              )}
            </select>

            {searchMode === "AVAILABLE" ? (
              <>
                {service === "GROOMING" ? (
                  <select
                    value={groomingCategory}
                    onChange={(e) => setGroomingCategory(e.target.value)}
                    className="rounded-md border bg-white px-3 py-2"
                    disabled={!hasLiveServicesForSuburb}
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
                  disabled={!hasLiveServicesForSuburb}
                />

                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={!hasLiveServicesForSuburb}
                />
              </>
            ) : (
              <>
                <div />
                <div />
                <div />
              </>
            )}

            <div className="md:col-span-5 flex items-center gap-3">
              <Button onClick={fetchSuppliers} disabled={servicesLoading && Boolean(suburb.trim())}>
                {searchMode === "AVAILABLE" ? "Check availability" : "Search"}
              </Button>

              {suburb.trim() && servicesLoading ? (
                <span className="text-sm text-gray-500">Checking live services…</span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {suburb.trim() && !servicesLoading && availableServices.length === 0 ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No live services are available in {suburb} yet. Join the waitlist if you want DogLife
            to launch there next.
          </div>
        ) : null}

        {loading ? <p>Loading suppliers...</p> : null}
        {error ? <p className="text-red-500">{error}</p> : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="transition hover:shadow-lg">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {supplier.logoUrl ? (
                      <img
                        src={supplier.logoUrl}
                        alt={supplier.businessName}
                        className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                      />
                    ) : null}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {supplier.businessName || "Unnamed Business"}
                      </h3>

                      {supplier.suburb ? (
                        <p className="mt-1 text-sm text-gray-500">{supplier.suburb}</p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap gap-2">
                        {supplier.isPreferred ? (
                          <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Preferred
                          </span>
                        ) : null}

                        {supplier.usedBefore ? (
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            Used before
                          </span>
                        ) : null}

                        <span className="rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                          {supplier.completedServicesCount ?? 0} completed
                        </span>

                        {searchMode === "AVAILABLE" && supplier.available ? (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
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
                    className={`rounded border px-3 py-1 text-xs ${
                      supplier.isPreferred
                        ? "border-green-200 bg-green-100 text-green-700"
                        : "border-gray-300 bg-white text-gray-500"
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

                <div className="flex items-end justify-between pt-2">
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

        {!loading && suppliers.length === 0 && availableServices.length > 0 ? (
          <div className="mt-10 text-center text-gray-500">
            {searchMode === "AVAILABLE"
              ? "No available providers found for this search."
              : `No ${selectedServiceLabel.toLowerCase()} providers found in this area yet.`}
          </div>
        ) : null}
      </div>
    </div>
  );
}