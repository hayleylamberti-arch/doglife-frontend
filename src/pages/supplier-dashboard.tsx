import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

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

/* =========================
   HELPERS
========================= */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  const prevBookingCount = useRef(0);
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(15);

  /* =========================
     MEDIA STATE
  ========================= */
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  /* =========================
     FETCH PROFILE
  ========================= */

  const { data: profileData } = useQuery({
    queryKey: ["supplierProfile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data.profile;
    },
  });

  const profile = profileData;

  useEffect(() => {
    if (profile?.logoUrl) {
      setLogoUrl(profile.logoUrl);
    }
  }, [profile]);

  /* =========================
     SAVE PROFILE
  ========================= */

  const saveProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.patch("/api/supplier/profile", payload);
    },
  });

  /* =========================
     FETCH BOOKINGS
  ========================= */

  const { data = [], isLoading } = useQuery({
    queryKey: ["supplierBookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data.bookings;
    },
    refetchInterval: 5000,
  });

  /* =========================
     ALERT SYSTEM
  ========================= */

  useEffect(() => {
    const pending = data.filter((b: any) => b.status === "PENDING");

    if (pending.length > prevBookingCount.current) {
      const newest = pending[0];

      setActiveAlert(newest);
      setCountdown(15);

      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});

      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300]);
      }
    }

    prevBookingCount.current = pending.length;
  }, [data]);

  useEffect(() => {
    if (!activeAlert) return;

    if (countdown <= 0) {
      setActiveAlert(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, activeAlert]);

  /* =========================
     UI
  ========================= */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* HERO */}
      <div className="bg-white rounded-2xl shadow p-6 flex justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {profile?.businessName || "Complete your profile"}
          </h2>
          <p className="text-gray-500">
            {profile?.businessAddress}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-semibold text-green-600">
            {profile?.approvalStatus}
          </p>
        </div>
      </div>

      {/* MEDIA SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow border space-y-6">
        <h2 className="text-xl font-semibold">Business Media</h2>

        {/* LOGO */}
        <div>
          <p className="text-sm text-gray-500 mb-2">Logo</p>

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

                  await saveProfileMutation.mutateAsync({ logoUrl: url });

                  setLogoUploading(false);
                }}
              />
            </label>

          </div>
        </div>

        {/* GALLERY */}
        <div>
          <p className="text-sm text-gray-500 mb-2">Gallery</p>

          <div className="flex flex-wrap gap-3">

            {gallery.map((img, i) => (
              <img key={i} src={img} className="w-24 h-24 rounded-xl object-cover border" />
            ))}

            <label className="w-24 h-24 border rounded-xl flex items-center justify-center cursor-pointer">
              +
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setGalleryUploading(true);

                  const url = await uploadToCloudinary(file);
                  setGallery((prev) => [...prev, url]);

                  setGalleryUploading(false);
                }}
              />
            </label>

          </div>
        </div>

      </div>

      {/* BOOKINGS */}
      <div className="space-y-4">
        {data.map((b: any) => (
          <div key={b.id} className="p-5 rounded-xl border bg-white shadow-sm">
            <p className="font-semibold">
              {b.owner?.firstName} {b.owner?.lastName}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}