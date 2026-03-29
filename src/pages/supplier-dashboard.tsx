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
  notes?: string;
  owner?: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  dog?: {
    name?: string;
    breed?: string;
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
  const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(" ");
  return fullName || "Unknown owner";
}

function getDogText(booking: Booking) {
  if (booking.dogs?.length) {
    return booking.dogs
      .map((d) => (d.breed ? `${d.name} (${d.breed})` : d.name))
      .join(", ");
  }
  if (booking.dog) {
    return booking.dog.breed
      ? `${booking.dog.name} (${booking.dog.breed})`
      : booking.dog.name;
  }
  return "—";
}

/* ================================
   COMPONENT
================================ */

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  /* ================================
     SERVICE FORM (NEW)
  ================================ */

  const [serviceForm, setServiceForm] = useState({
    serviceType: "WALKING",
    unit: "PER_HOUR",
    durationMinutes: "60",
    basePrice: "",
    notes: "",
    pricingTiers: [
      { dogSize: "SMALL", price: "" },
      { dogSize: "MEDIUM", price: "" },
      { dogSize: "LARGE", price: "" },
    ],
  });

  /* ================================
     FETCH DATA
  ================================ */

  const { data: profileData, isLoading: loadingProfile, isError: profileError } =
    useQuery({
      queryKey: ["supplier-profile"],
      queryFn: async () => (await api.get("/supplier/profile")).data,
    });

  const {
    data: servicesData,
    isLoading: loadingServices,
    isError: servicesError,
  } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => (await api.get("/supplierServices")).data,
  });

  const {
    data: bookingsData,
    isLoading: loadingBookings,
    isError: bookingsError,
  } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => (await api.get("/supplier/bookings")).data,
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
      try {
        return await api.patch("/supplier/profile", payload);
      } catch {
        return api.post("/supplier/profile", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-profile"] });
    },
  });

  const addService = useMutation({
    mutationFn: async () =>
      api.post("/supplierServices", {
        serviceType: serviceForm.serviceType,
        unit: serviceForm.unit,
        durationMinutes: Number(serviceForm.durationMinutes),
        basePrice: Number(serviceForm.basePrice),
        notes: serviceForm.notes,
        pricingTiers: serviceForm.pricingTiers.map((t) => ({
          dogSize: t.dogSize,
          price: Number(t.price),
        })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["supplier-services"] });

      setServiceForm({
        serviceType: "WALKING",
        unit: "PER_HOUR",
        durationMinutes: "60",
        basePrice: "",
        notes: "",
        pricingTiers: [
          { dogSize: "SMALL", price: "" },
          { dogSize: "MEDIUM", price: "" },
          { dogSize: "LARGE", price: "" },
        ],
      });
    },
  });

  const bookingAction = useMutation({
  mutationFn: async ({ id, action }: { id: string; action: string }) => {
    if (action === "complete" || action === "mark-paid") {
      return api.patch(`/api/bookings/${id}/${action}`);
    }

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
      inProgress: bookings.filter((b) => b.status === "IN_PROGRESS"),
      completedUnbilled: bookings.filter(
        (b) => b.status === "COMPLETED_UNBILLED"
      ),
      completed: bookings.filter(
        (b) => b.status === "COMPLETED" || b.status === "PAID"
      ),
      cancelled: bookings.filter((b) => b.status === "CANCELLED"),
    };
  }, [bookings]);

  /* ================================
     LOADING / ERROR
  ================================ */

  if (loadingProfile || loadingServices || loadingBookings) {
    return <div className="p-6">Loading supplier dashboard...</div>;
  }

  if (profileError && servicesError && bookingsError) {
    return <div className="p-6 text-red-600">Failed to load dashboard.</div>;
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

        <select
          className="border p-2 w-full"
          value={serviceForm.unit}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, unit: e.target.value })
          }
        >
          <option value="PER_HOUR">Per Hour</option>
          <option value="PER_NIGHT">Per Night</option>
          <option value="PER_DAY">Per Day</option>
        </select>

        <input
          className="border p-2 w-full"
          placeholder="Duration (minutes)"
          value={serviceForm.durationMinutes}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, durationMinutes: e.target.value })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Base Price (ZAR)"
          value={serviceForm.basePrice}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, basePrice: e.target.value })
          }
        />

        {/* Pricing tiers */}
        <div>
          <p className="font-medium">Pricing by Dog Size</p>
          {serviceForm.pricingTiers.map((tier, i) => (
            <div key={tier.dogSize} className="flex gap-2 mt-1">
              <span className="w-20">{tier.dogSize}</span>
              <input
                className="border p-2 flex-1"
                placeholder="Price"
                value={tier.price}
                onChange={(e) => {
                  const updated = [...serviceForm.pricingTiers];
                  updated[i].price = e.target.value;
                  setServiceForm({ ...serviceForm, pricingTiers: updated });
                }}
              />
            </div>
          ))}
        </div>

        <textarea
          className="border p-2 w-full"
          placeholder="Notes (e.g. per dog, discounts for multiple dogs)"
          value={serviceForm.notes}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, notes: e.target.value })
          }
        />

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => addService.mutate()}
        >
          Add Service
        </button>

        <div>
          {services.map((s) => (
            <div key={s.id} className="border p-2 mt-2">
              {formatService(s.serviceType)} · R{s.basePrice}
            </div>
          ))}
        </div>
      </div>

      {/* BOOKINGS (unchanged) */}
    </div>
  );
}