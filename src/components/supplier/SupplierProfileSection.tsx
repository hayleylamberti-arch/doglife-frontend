import { useState, useEffect } from "react";

type BusinessProfile = {
  businessName?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  operatingSuburbs?: string[];
};

type Props = {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
};

export default function SupplierProfileSection({ profile, onSave }: Props) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [suburbInput, setSuburbInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /* ================================
     🔥 FIX: sync form when profile loads
  ================================ */
  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const addSuburb = () => {
    if (!suburbInput.trim()) return;

    // prevent duplicates
    if (form.operatingSuburbs?.includes(suburbInput.trim())) {
      setSuburbInput("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      operatingSuburbs: [
        ...(prev.operatingSuburbs || []),
        suburbInput.trim(),
      ],
    }));

    setSuburbInput("");
  };

  const removeSuburb = (suburb: string) => {
    setForm((prev) => ({
      ...prev,
      operatingSuburbs: prev.operatingSuburbs?.filter((s) => s !== suburb),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border p-4 rounded space-y-4">
      <h2 className="text-xl font-semibold">Business Profile</h2>

      {/* Business Name */}
      <div>
        <label className="text-sm font-medium">Business Name</label>
        <input
          className="border p-2 w-full"
          value={form.businessName || ""}
          onChange={(e) =>
            setForm({ ...form, businessName: e.target.value })
          }
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Business Description</label>
        <textarea
          className="border p-2 w-full"
          value={form.description || ""}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
      </div>

      {/* Website */}
      <div>
        <label className="text-sm font-medium">Website</label>
        <input
          className="border p-2 w-full"
          value={form.website || ""}
          onChange={(e) =>
            setForm({ ...form, website: e.target.value })
          }
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          className="border p-2 w-full"
          value={form.contactEmail || ""}
          onChange={(e) =>
            setForm({ ...form, contactEmail: e.target.value })
          }
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium">Phone</label>
        <input
          className="border p-2 w-full"
          value={form.contactPhone || ""}
          onChange={(e) =>
            setForm({ ...form, contactPhone: e.target.value })
          }
        />
      </div>

      {/* Suburbs */}
      <div>
        <p className="font-medium">Operating Suburbs</p>

        <div className="flex gap-2">
          <input
            className="border p-2 flex-1"
            value={suburbInput}
            onChange={(e) => setSuburbInput(e.target.value)}
            placeholder="Add suburb"
          />
          <button
            onClick={addSuburb}
            className="bg-gray-200 px-3 rounded"
            type="button"
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mt-2">
          {form.operatingSuburbs?.map((s) => (
            <span
              key={s}
              className="bg-gray-100 px-2 py-1 rounded cursor-pointer"
              onClick={() => removeSuburb(s)}
            >
              {s} ✕
            </span>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}