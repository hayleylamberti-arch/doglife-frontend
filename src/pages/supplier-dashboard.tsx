import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import SupplierProfileSection from "@/components/supplier/SupplierProfileSection";

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
  aboutServices?: string;
  websiteUrl?: string;
  contactEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
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
  notes?: string;
  owner?: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  dogs?: Array<{
    name?: string;
    breed?: string;
  }>;
};

/* ================================
   HELPERS
================================ */

function formatService(service?: string) {
  if (!service) return "Service";
  return service
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function getOwnerName(owner?: Booking["owner"]) {
  if (!owner) return "Unknown owner";
  if (owner.name) return owner.name;
  return [owner.firstName, owner.lastName].filter(Boolean).join(" ");
}

/* ================================
   COMPONENT
================================ */

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  /* ================================
     SERVICE FORM
  ================================ */

  const [serviceForm, setServiceForm] = useState({
    serviceType: "WALKING",
    unit: "PER_HOUR",
    durationMinutes: "60",
    basePrice: "",
  });

  /* ================================
     FETCH DATA
  ================================ */

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => (await api.get("/api/supplier/profile")).data,
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => (await api.get("/api/supplier/services")).data,
  });

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => (await api.get("/api/supplier/bookings")).data,
  });

  const profile: BusinessProfile =
    profileData?.profile ?? profileData ?? {};

  const services: SupplierService[] =
    servicesData?.services ?? servicesData ?? [];

  const bookings: Booking[] =
    bookingsData?.bookings ?? bookingsData ?? [];

  /* ================================
     MUTATIONS
  ================================ */

  const saveProfile = useMutation({
    mutationFn: async (payload: BusinessProfile) => {
      return api.patch("/api/supplier/profile", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["supplier-profile"] });
      alert("Profile saved ✅");
    },
  });

  const addService = useMutation({
    mutationFn: async () =>
      api.post("/api/supplier/services", {
        serviceType: serviceForm.serviceType,
        unit: serviceForm.unit,
        durationMinutes: Number(serviceForm.durationMinutes),
        basePrice: Number(serviceForm.basePrice),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setServiceForm({
        serviceType: "WALKING",
        unit: "PER_HOUR",
        durationMinutes: "60",
        basePrice: "",
      });
    },
  });

  const bookingAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return api.patch(`/api/supplier/bookings/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-bookings"] });
    },
  });

  /* ================================
     GROUP BOOKINGS
  ================================ */

  const grouped = useMemo(() => {
    return {
      pending: bookings.filter((b) => b.status === "PENDING"),
      confirmed: bookings.filter((b) => b.status === "CONFIRMED"),
      completed: bookings.filter((b) => b.status === "COMPLETED"),
    };
  }, [bookings]);

  /* ================================
     LOADING
  ================================ */

  if (loadingProfile || loadingServices || loadingBookings) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-3xl font-semibold">
        Welcome {profile.businessName || "Supplier"}
      </h1>

      {/* ✅ PROFILE (FIXED) */}
      <SupplierProfileSection
        profile={profile}
        onSave={(updated) => saveProfile.mutate(updated)}
      />

      {/* SERVICES */}
      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>

        <select
          className="border p-2 w-full"
          value={serviceForm.serviceType}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, serviceType: e.target.value })
          }
        >
          <option value="WALKING">Dog Walking</option>
          <option value="BOARDING">Boarding</option>
          <option value="GROOMING">Grooming</option>
        </select>

        <input
          className="border p-2 w-full"
          placeholder="Base Price (ZAR)"
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
            {formatService(s.serviceType)} · R{s.basePrice}
          </div>
        ))}
      </div>

      {/* BOOKINGS */}
      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-semibold">Bookings</h2>

        {grouped.pending.map((b) => (
          <div key={b.id} className="border p-2">
            {formatService(b.serviceType)} · {formatDate(b.startAt)}

            <button
              onClick={() =>
                bookingAction.mutate({ id: b.id, action: "confirm" })
              }
              className="ml-4 bg-green-600 text-white px-2 py-1 rounded"
            >
              Accept
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}