import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

/* =========================
   CLOUDINARY UPLOAD
========================= */
async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "doglife_upload");

  const res = await fetch("https://api.cloudinary.com/v1_1/djv39c4ta/image/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data.secure_url;
}

type SuburbOption = {
  id: string;
  suburbName: string;
  city?: string | null;
  province?: string | null;
};

type SupplierProfileResponse = {
  id: string;
  businessName?: string | null;
  businessAddress?: string | null;
  suburb?: string | null;
  aboutServices?: string | null;
  logoUrl?: string | null;
  galleryUrls?: string[];
  operatingAreas?: Array<{
    suburb?: {
      id: string;
      suburbName: string;
      city?: string | null;
      province?: string | null;
    } | null;
  }>;
};

export default function BusinessProfilePage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [aboutServices, setAboutServices] = useState("");
  const [operatingAreaIds, setOperatingAreaIds] = useState<string[]>([]);
  const [suburbSearch, setSuburbSearch] = useState("");

  /* =========================
     FETCH PROFILE
  ========================= */

  const { data, refetch: refetchProfile } = useQuery({
    queryKey: ["supplierProfile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data.profile as SupplierProfileResponse;
    },
  });

  const { data: suburbsData, isLoading: suburbsLoading } = useQuery({
    queryKey: ["suburbs"],
    queryFn: async () => {
      const res = await api.get("/api/suburbs");
      const payload = res.data;

      if (Array.isArray(payload)) return payload as SuburbOption[];
      if (Array.isArray(payload?.suburbs)) return payload.suburbs as SuburbOption[];
      if (Array.isArray(payload?.data)) return payload.data as SuburbOption[];

      return [];
    },
  });

  const profile = data;
  const suburbs = Array.isArray(suburbsData) ? suburbsData : [];

  /* =========================
     LOAD DATA INTO STATE
  ========================= */

  useEffect(() => {
    if (!profile) return;

    setBusinessName(profile.businessName || "");
    setBusinessAddress(profile.businessAddress || "");
    setSuburb(profile.suburb || "");
    setAboutServices(profile.aboutServices || "");

    if (profile.logoUrl) setLogoUrl(profile.logoUrl);
    else setLogoUrl(null);

    if (profile.galleryUrls) setGallery(profile.galleryUrls);
    else setGallery([]);

    const existingOperatingAreaIds =
      profile.operatingAreas
        ?.map((area) => area?.suburb?.id)
        .filter((value): value is string => Boolean(value)) || [];

    setOperatingAreaIds(existingOperatingAreaIds);
  }, [profile]);

  /* =========================
     FILTERED SUBURBS
  ========================= */

  const filteredSuburbs = useMemo(() => {
    const search = suburbSearch.trim().toLowerCase();

    const sorted = [...suburbs].sort((a, b) =>
      `${a.suburbName} ${a.city || ""}`.localeCompare(`${b.suburbName} ${b.city || ""}`)
    );

    if (!search) return sorted;

    return sorted.filter((item) => {
      const haystack = `${item.suburbName} ${item.city || ""} ${item.province || ""}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [suburbs, suburbSearch]);

  function toggleOperatingArea(suburbId: string) {
    setOperatingAreaIds((prev) =>
      prev.includes(suburbId) ? prev.filter((id) => id !== suburbId) : [...prev, suburbId]
    );
  }

  /* =========================
     SAVE PROFILE
  ========================= */

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/api/supplier/profile", {
        businessName,
        businessAddress,
        suburb,
        aboutServices,
        logoUrl,
        operatingAreaIds,
      });
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  /* =========================
     SAVE GALLERY
  ========================= */

  const saveGalleryMutation = useMutation({
    mutationFn: async (images: string[]) => {
      await api.post("/api/supplier/gallery", { images });
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Business Profile</h1>

      {/* =========================
         LOGO
      ========================= */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Logo</h2>

        <div className="flex items-center gap-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Business logo"
              className="w-20 h-20 rounded-xl object-cover border"
            />
          )}

          <label className="cursor-pointer bg-black text-white px-4 py-2 rounded-lg text-sm">
            {logoUploading ? "Uploading..." : "Upload Logo"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  setLogoUploading(true);

                  const url = await uploadToCloudinary(file);
                  setLogoUrl(url);

                  await api.patch("/api/supplier/profile", {
                    logoUrl: url,
                    operatingAreaIds,
                  });

                  refetchProfile();
                } finally {
                  setLogoUploading(false);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* =========================
         GALLERY
      ========================= */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Gallery</h2>

        <div className="flex flex-wrap gap-3">
          {gallery.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt={`Gallery ${i + 1}`} className="w-24 h-24 rounded-xl object-cover border" />

              <button
                type="button"
                onClick={async () => {
                  const updated = gallery.filter((_, index) => index !== i);
                  setGallery(updated);
                  await saveGalleryMutation.mutateAsync(updated);
                }}
                className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded"
              >
                ✕
              </button>
            </div>
          ))}

          <label className="w-24 h-24 border rounded-xl flex items-center justify-center cursor-pointer">
            {galleryUploading ? "..." : "+"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  setGalleryUploading(true);

                  const url = await uploadToCloudinary(file);
                  const updated = [...gallery, url];
                  setGallery(updated);

                  await saveGalleryMutation.mutateAsync(updated);
                } finally {
                  setGalleryUploading(false);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* =========================
         BUSINESS DETAILS
      ========================= */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Business Details</h2>

        <input
          className="w-full border p-3 rounded-lg"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
        />

        <input
          className="w-full border p-3 rounded-lg"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="Address"
        />

        <input
          className="w-full border p-3 rounded-lg"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          placeholder="Base suburb (for display)"
        />

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service suburbs
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select all suburbs you are willing to travel to. Your profile will appear in searches for these suburbs.
            </p>
          </div>

          <input
            className="w-full border p-3 rounded-lg"
            value={suburbSearch}
            onChange={(e) => setSuburbSearch(e.target.value)}
            placeholder="Search suburbs"
          />

          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 p-3 space-y-2">
            {suburbsLoading ? (
              <div className="text-sm text-gray-500">Loading suburbs...</div>
            ) : filteredSuburbs.length === 0 ? (
              <div className="text-sm text-gray-500">No suburbs found.</div>
            ) : (
              filteredSuburbs.map((item) => {
                const checked = operatingAreaIds.includes(item.id);

                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOperatingArea(item.id)}
                      className="mt-1"
                    />

                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{item.suburbName}</div>
                      <div className="text-gray-500">
                        {[item.city, item.province].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="text-sm text-gray-600">
            Selected suburbs: {operatingAreaIds.length}
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Details"}
        </Button>
      </div>

      {/* =========================
         DESCRIPTION
      ========================= */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">About Your Services</h2>

        <textarea
          className="w-full border p-3 rounded-lg"
          rows={5}
          value={aboutServices}
          onChange={(e) => setAboutServices(e.target.value)}
          placeholder="Describe your services..."
        />

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Description"}
        </Button>
      </div>

      {/* =========================
         PREVIEW BUTTON
      ========================= */}
      <div className="flex justify-end">
        <Button onClick={() => (window.location.href = `/supplier/${profile?.id}`)}>
          Preview Public Profile
        </Button>
      </div>
    </div>
  );
}