import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Brand from "@/components/Brand";
import { Loader2 } from "lucide-react";

interface Suburb {
  id: string;
  suburbName: string;
  city: string;
  province: string;
}

export default function SupplierOnboarding() {
  const navigate = useNavigate();

  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [loadingSuburbs, setLoadingSuburbs] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [aboutServices, setAboutServices] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [suburbId, setSuburbId] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch suburbs
  useEffect(() => {
    async function fetchSuburbs() {
      try {
        const res = await api.get("/api/suburbs");
        setSuburbs(res.data.suburbs);
      } catch (err) {
        console.error("Failed to load suburbs", err);
      } finally {
        setLoadingSuburbs(false);
      }
    }

    fetchSuburbs();
  }, []);

  // Submit Step 1
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await api.post("/api/supplier/profile", {
        businessName,
        aboutServices,
        businessAddress,
        businessPhone,
        suburbId,
      });

      navigate("/supplier-onboarding?step=2");
    } catch (err) {
      console.error(err);
      setError("Failed to save details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 px-4">

      {/* Logo */}
      <div className="mb-6">
        <Brand />
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold">
          Set up your DogLife business profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Step 1 of 3 — Business details
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6">

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            className="border rounded-md px-3 py-2"
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <textarea
            className="border rounded-md px-3 py-2"
            placeholder="Describe your services"
            value={aboutServices}
            onChange={(e) => setAboutServices(e.target.value)}
            rows={4}
            required
          />

          <input
            className="border rounded-md px-3 py-2"
            placeholder="Business Address"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
          />

          <input
            className="border rounded-md px-3 py-2"
            placeholder="Business Phone"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            required
          />

          {loadingSuburbs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suburbs...
            </div>
          ) : (
            <select
              className="border rounded-md px-3 py-2"
              value={suburbId}
              onChange={(e) => setSuburbId(e.target.value)}
              required
            >
              <option value="">Select Suburb</option>
              {suburbs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.suburbName} ({s.city})
                </option>
              ))}
            </select>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {saving ? "Saving..." : "Continue"}
          </button>

        </form>

        {/* Progress */}
        <div className="text-center text-xs text-muted-foreground mt-6">
          Step 1 of 3
        </div>

      </div>

    </div>
  );
}