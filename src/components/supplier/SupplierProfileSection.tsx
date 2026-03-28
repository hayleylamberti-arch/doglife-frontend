import { useState } from "react";

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

  const addSuburb = () => {
    if (!suburbInput.trim()) return;

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

  return (
    <div className="border p-4 rounded space-y-4">
      <h2 className="text-xl font-semibold">Business Profile</h2>

      <input
        className="border p-2 w-full"
        placeholder="Business Name"
        value={form.businessName || ""}
        onChange={(e) =>
          setForm({ ...form, businessName: e.target.value })
        }
      />

      <textarea
        className="border p-2 w-full"
        placeholder="Business Description"
        value={form.description || ""}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <input
        className="border p-2 w-full"
        placeholder="Website"
        value={form.website || ""}
        onChange={(e) =>
          setForm({ ...form, website: e.target.value })
        }
      />

      <input
        className="border p-2 w-full"
        placeholder="Email"
        value={form.contactEmail || ""}
        onChange={(e) =>
          setForm({ ...form, contactEmail: e.target.value })
        }
      />

      <input
        className="border p-2 w-full"
        placeholder="Phone"
        value={form.contactPhone || ""}
        onChange={(e) =>
          setForm({ ...form, contactPhone: e.target.value })
        }
      />

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
            className="bg-gray-200 px-3"
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

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={() => onSave(form)}
      >
        Save Profile
      </button>
    </div>
  );
}