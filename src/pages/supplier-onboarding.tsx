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

  // Load suburbs once
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!suburbId) {
      setError("Please select a suburb");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const selectedSuburb = suburbs.find((item) => item.id === suburbId);

      if (!selectedSuburb) {
        setError("Please select a valid suburb");
        setSaving(false);
        return;
      }

      const res = await api.post("/api/supplier/profile", {
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim(),
        suburb: selectedSuburb.suburbName,
        operatingAreaIds: [suburbId],
        aboutServices: aboutServices.trim() || null,
        businessAddress: businessAddress.trim() || null,
      });

      console.log("Supplier profile saved:", res.data);

      navigate("/supplier/services", { replace: true });

    } catch (err) {
      console.error(err);
      setError("Failed to save business details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">

      <div>
        <h1 className="text-3xl font-semibold">
          Set up your business
        </h1>

        <p className="text-muted-foreground mt-1">
          Start with the essentials. You can add more detail later.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="font-medium text-blue-900">
          First, tell us who you are.
        </p>
        <p className="mt-1 text-sm text-blue-800">
          Next, you’ll add your first service and set when you’re available.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white border rounded-xl p-6 shadow-sm"
      >

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business name
          </label>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Happy Paws Grooming"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            About your business
            <span className="ml-2 font-normal text-gray-500">
              Optional
            </span>
          </label>

          <textarea
            className="w-full border rounded-md px-3 py-2 min-h-[100px]"
            placeholder="A short introduction to your business. You can come back to this later."
            value={aboutServices}
            onChange={(e) => setAboutServices(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business address
            <span className="ml-2 font-normal text-gray-500">
              Optional for now
            </span>
          </label>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="You can add your full business address later"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business phone
          </label>

          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="0821234567"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Primary operating suburb
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
          {saving ? "Saving..." : "Continue to add a service"}
        </button>

      </form>

    </div>
  );
}