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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      navigate("/supplier-onboarding?step=2");

    } catch (err) {
      console.error(err);
      setError("Failed to save details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex justify-center py-12">

      <div className="w-full max-w-lg">

        <h1 className="text-2xl font-semibold mb-1">
          Create your business profile
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          Step 1 of 3
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white border rounded-lg p-6 shadow-sm"
        >

          <div>
            <label className="text-sm font-medium">
              Business Name
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Describe your services
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 mt-1"
              rows={3}
              value={aboutServices}
              onChange={(e) => setAboutServices(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Business Address
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Business Phone
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Service Area
            </label>

            {loadingSuburbs ? (
              <p className="text-sm text-muted-foreground mt-2">
                Loading suburbs...
              </p>
            ) : (
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={suburbId}
                onChange={(e) => setSuburbId(e.target.value)}
                required
              >
                <option value="">Select suburb</option>

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
            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Continue"}
          </button>

        </form>

      </div>

    </div>
  );
}