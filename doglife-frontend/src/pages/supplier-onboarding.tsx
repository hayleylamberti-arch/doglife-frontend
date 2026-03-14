import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

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

  /* Fetch suburbs ONLY ONCE */

  useEffect(() => {
    const fetchSuburbs = async () => {
      try {
        const res = await api.get("/api/suburbs");
        setSuburbs(res.data.suburbs || []);
      } catch (err) {
        console.error("Failed to load suburbs", err);
      } finally {
        setLoadingSuburbs(false);
      }
    };

    fetchSuburbs();
  }, []);

  /* Submit form */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!suburbId) {
      setError("Please select a suburb");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/api/supplier/profile", {
        businessName,
        aboutServices,
        businessAddress,
        businessPhone,
        suburbId,
      });

      navigate("/supplier-dashboard");

    } catch (err) {
      console.error(err);
      setError("Failed to save business details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">

      <div>
        <h1 className="text-3xl font-semibold">
          Set up your business
        </h1>

        <p className="text-muted-foreground mt-1">
          Step 1 of 2 — Tell customers about your services
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white border rounded-xl p-6 shadow-sm"
      >

        {/* Business Name */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business Name
          </label>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Happy Paws Grooming"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        {/* Description */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Describe your services
          </label>

          <textarea
            className="w-full border rounded-md px-3 py-2 min-h-[100px]"
            placeholder="Tell dog owners about your services, experience and what makes you special."
            value={aboutServices}
            onChange={(e) => setAboutServices(e.target.value)}
            required
          />
        </div>

        {/* Address */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business Address
          </label>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="123 Main Street"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
          />
        </div>

        {/* Phone */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business Phone
          </label>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="0821234567"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            required
          />
        </div>

        {/* Suburb */}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Suburb
          </label>

          {loadingSuburbs ? (
            <p className="text-sm text-gray-500">
              Loading suburbs...
            </p>
          ) : (
            <select
              className="w-full border rounded-md px-3 py-2"
              value={suburbId}
              onChange={(e) => setSuburbId(e.target.value)}
              required
            >
              <option value="">
                Select suburb
              </option>

              {suburbs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.suburbName} ({s.city})
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Continue"}
        </button>

      </form>
    </div>
  );
}