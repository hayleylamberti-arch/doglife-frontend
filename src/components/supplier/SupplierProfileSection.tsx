import { useState, useEffect } from "react";

type BusinessProfile = {
  businessName?: string;
  aboutServices?: string;
  websiteUrl?: string;
  contactEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
};

type Props = {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
};

export default function SupplierProfileSection({ profile, onSave }: Props) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

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

      {/* Description (FIXED → aboutServices) */}
      <div>
        <label className="text-sm font-medium">Business Description</label>
        <textarea
          className="border p-2 w-full"
          value={form.aboutServices || ""}
          onChange={(e) =>
            setForm({ ...form, aboutServices: e.target.value })
          }
        />
      </div>

      {/* Website (FIXED → websiteUrl) */}
      <div>
        <label className="text-sm font-medium">Website</label>
        <input
          className="border p-2 w-full"
          value={form.websiteUrl || ""}
          onChange={(e) =>
            setForm({ ...form, websiteUrl: e.target.value })
          }
        />
      </div>

      {/* Email (correct) */}
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

      {/* Phone (FIXED → businessPhone) */}
      <div>
        <label className="text-sm font-medium">Phone</label>
        <input
          className="border p-2 w-full"
          value={form.businessPhone || ""}
          onChange={(e) =>
            setForm({ ...form, businessPhone: e.target.value })
          }
        />
      </div>

      {/* Address (FIXED → businessAddress) */}
      <div>
        <label className="text-sm font-medium">Business Address</label>
        <input
          className="border p-2 w-full"
          value={form.businessAddress || ""}
          onChange={(e) =>
            setForm({ ...form, businessAddress: e.target.value })
          }
        />
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