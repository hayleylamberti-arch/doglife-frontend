import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

/* ================================
   TYPES
================================ */

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "COMPLETED_UNBILLED"
  | "PAID"
  | "CANCELLED";

type BusinessProfile = {
  businessName?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  operatingSuburbs?: string[];
};

type SupplierService = {
  id: string;
  serviceType: string;
  durationMinutes: number;
  basePrice: number;
};

type Booking = {
  id: string;
  status: BookingStatus;
  serviceType?: string;
  startAt?: string;
  suburb?: string;
  owner?: { name?: string };
  dog?: { name?: string; breed?: string };
};

/* ================================
   HELPERS
================================ */

function formatService(service?: string) {
  if (!service) return "Service";
  return service.replace(/_/g, " ");
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

/* ================================
   COMPONENT
================================ */

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState<BusinessProfile>({});
  const [serviceForm, setServiceForm] = useState({
    serviceType: "WALKING",
    durationMinutes: "60",
    basePrice: "",
  });

  /* ================================
     FETCH DATA
  ================================ */

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => (await api.get("/supplier/profile")).data,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => (await api.get("/supplier/services")).data,
  });

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => (await api.get("/supplier/bookings")).data,
  });

  const profile: BusinessProfile = profileData?.profile ?? {};
  const services: SupplierService[] = servicesData?.services ?? [];
  const bookings: Booking[] = bookingsData?.bookings ?? [];

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  /* ================================
     MUTATIONS
  ================================ */

  const saveProfile = useMutation({
    mutationFn: async () => api.patch("/supplier/profile", profileForm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplier-profile"] }),
  });

  const addService = useMutation({
    mutationFn: async () =>
      api.post("/supplier/services", {
        serviceType: serviceForm.serviceType,
        durationMinutes: Number(serviceForm.durationMinutes),
        basePrice: Number(serviceForm.basePrice),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setServiceForm({ serviceType: "WALKING", durationMinutes: "60", basePrice: "" });
    },
  });

  const bookingAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) =>
      api.patch(`/supplier/bookings/${id}/${action}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplier-bookings"] }),
  });

  /* ================================
     GROUP BOOKINGS
  ================================ */

  const grouped = useMemo(() => {
    return {
      pending: bookings.filter((b) => b.status === "PENDING"),
      confirmed: bookings.filter((b) => b.status === "CONFIRMED"),
      inProgress: bookings.filter((b) => b.status === "IN_PROGRESS"),
    };
  }, [bookings]);

  if (loadingProfile || loadingBookings) {
    return <div className="p-6">Loading supplier dashboard...</div>;
  }

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-3xl font-semibold">
        Welcome {profile.businessName || "Supplier"}
      </h1>

      {/* PROFILE */}
      <div className="border p-4 rounded space-y-3">
        <h2 className="text-xl font-semibold">Business Profile</h2>

        <input
          className="border p-2 w-full"
          placeholder="Business Name"
          value={profileForm.businessName || ""}
          onChange={(e) =>
            setProfileForm({ ...profileForm, businessName: e.target.value })
          }
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={profileForm.description || ""}
          onChange={(e) =>
            setProfileForm({ ...profileForm, description: e.target.value })
          }
        />

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => saveProfile.mutate()}
        >
          Save Profile
        </button>
      </div>

      {/* SERVICES */}
      <div className="border p-4 rounded space-y-3">
        <h2 className="text-xl font-semibold">Services</h2>

        <input
          className="border p-2"
          placeholder="Price"
          value={serviceForm.basePrice}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, basePrice: e.target.value })
          }
        />

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => addService.mutate()}
        >
          Add Service
        </button>

        {services.map((s) => (
          <div key={s.id} className="border p-2">
            {formatService(s.serviceType)} – R{s.basePrice}
          </div>
        ))}
      </div>

      {/* BOOKINGS */}
      <div className="space-y-6">

        <h2 className="text-xl font-semibold">Bookings</h2>

        {grouped.pending.map((b) => (
          <div key={b.id} className="border p-3 rounded">
            <p>{formatService(b.serviceType)}</p>
            <p>{b.suburb}</p>

            <button
              onClick={() => bookingAction.mutate({ id: b.id, action: "accept" })}
              className="bg-green-600 text-white px-2 py-1 mr-2"
            >
              Accept
            </button>

            <button
              onClick={() => bookingAction.mutate({ id: b.id, action: "decline" })}
              className="bg-red-600 text-white px-2 py-1"
            >
              Decline
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}