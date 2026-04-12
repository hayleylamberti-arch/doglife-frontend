import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/* =========================
   CLOUDINARY UPLOAD
========================= */
async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "doglife_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/djv39c4ta/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
}

export default function BusinessProfilePage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [aboutServices, setAboutServices] = useState("");

  /* =========================
     FETCH PROFILE
  ========================= */

  const { data } = useQuery({
    queryKey: ["supplierProfile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data.profile;
    },
  });

  const profile = data;

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
    if (profile.galleryUrls) setGallery(profile.galleryUrls);
  }, [profile]);

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
      });
    },
  });

  /* =========================
     SAVE GALLERY
  ========================= */

  const saveGalleryMutation = useMutation({
    mutationFn: async (images: string[]) => {
      await api.post("/api/supplier/gallery", { images });
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
            <img src={logoUrl} className="w-20 h-20 rounded-xl object-cover border" />
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

                setLogoUploading(true);

                const url = await uploadToCloudinary(file);
                setLogoUrl(url);

                await api.patch("/api/supplier/profile", { logoUrl: url });

                setLogoUploading(false);
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

              <img
                src={img}
                className="w-24 h-24 rounded-xl object-cover border"
              />

              <button
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

          {/* ADD IMAGE */}
          <label className="w-24 h-24 border rounded-xl flex items-center justify-center cursor-pointer">
            {galleryUploading ? "..." : "+"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setGalleryUploading(true);

                const url = await uploadToCloudinary(file);

                const updated = [...gallery, url];
                setGallery(updated);

                await saveGalleryMutation.mutateAsync(updated);

                setGalleryUploading(false);
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
          placeholder="Suburb"
        />

        <Button onClick={() => saveMutation.mutate()}>
          Save Details
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

        <Button onClick={() => saveMutation.mutate()}>
          Save Description
        </Button>
      </div>

      {/* =========================
         PREVIEW BUTTON
      ========================= */}
      <div className="flex justify-end">
        <Button
          onClick={() => window.location.href = `/supplier/${profile?.id}`}
        >
          Preview Public Profile
        </Button>
      </div>

    </div>
  );
}