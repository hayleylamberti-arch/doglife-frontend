import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function SupplierOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [suburb, setSuburb] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!businessName) {
      setError("Business name is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await api.patch("/api/suppliers/onboarding", {
        businessName,
        phoneNumber,
        suburb,
      });

      // Redirect to dashboard after success
      navigate("/dashboard", { replace: true });

    } catch (err: any) {
      setError("Failed to save details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Supplier Onboarding</h1>
      <p className="text-muted-foreground">
        Step 1: Complete your business details.
      </p>

      <div className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Suburb"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button
        className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        onClick={handleSubmit}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}