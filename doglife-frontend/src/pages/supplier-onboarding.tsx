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

  // 🔹 Fetch suburbs on load
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

  // 🔹 Submit Step 1
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

      // 👉 Move to Step 2
      navigate("/supplier-onboarding?step=2");

    } catch (err: any) {
      console.error(err);
      setError("Failed to save details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h1>Supplier Onboarding</h1>
      <p>Step 1: Complete your business details.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        
        <input
          placeholder="Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />

        <textarea
          placeholder="Describe your services"
          value={aboutServices}
          onChange={(e) => setAboutServices(e.target.value)}
          required
        />

        <input
          placeholder="Business Address"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          required
        />

        <input
          placeholder="Business Phone"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
          required
        />

        {loadingSuburbs ? (
          <p>Loading suburbs...</p>
        ) : (
          <select
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

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}