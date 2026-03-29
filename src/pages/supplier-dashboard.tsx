import { useMemo, useState, useEffect } from "react";
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
  if (booking.dogs && booking.dogs.length > 0) {
    return booking.dogs
      .map((dog) => {
        const name = dog.name || "Dog";
        return dog.breed ? `${name} (${dog.breed})` : name;
      })
      .join(", ");
  }

  if (booking.dog) {
    const name = booking.dog.name || "Dog";
    return booking.dog.breed ? `${name} (${booking.dog.breed})` : name;
  }

  return "—";
}

/* ================================
   COMPONENT
================================ */

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  const [serviceForm, setServiceForm] = useState({
    serviceType: "WALKING",
    durationMinutes: "60",
    basePrice: "",
  });

  /* ================================
     FETCH DATA
  ================================ */

  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
  } = useQuery({
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
        durationMinutes: Number(serviceForm.durationMinutes),
        basePrice: Number(serviceForm.basePrice),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setServiceForm({
        serviceType: "WALKING",
        durationMinutes: "60",
        basePrice: "",
      });
    },
  });

  const bookingAction = useMutation({
  mutationFn: async ({ id, action }: { id: string; action: string }) => {
    if (action === "complete" || action === "mark-paid") {
      return api.patch(`/bookings/${id}/${action}`);
    }

    return api.patch(`/supplier/bookings/${id}/${action}`);
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
     SUBURB HELPERS
  ================================ */

  if (loadingProfile || loadingServices || loadingBookings) {
    return <div className="p-6">Loading supplier dashboard...</div>;
  }

  if (profileError && servicesError && bookingsError) {
    return (
      <div className="p-6 text-red-600">
        Failed to load supplier dashboard.
      </div>
    );
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
          className="border p-2 rounded w-full"
          value={serviceForm.serviceType}
          onChange={(e) =>
            setServiceForm({ ...serviceForm, serviceType: e.target.value })
          }
        >
          <option value="WALKING">Dog Walking</option>
          <option value="GROOMING">Grooming</option>
          <option value="BOARDING">Boarding</option>
          <option value="TRAINING">Training</option>
          <option value="DAYCARE">Daycare</option>
          <option value="PET_SITTING">Pet Sitting</option>
          <option value="PET_TRANSPORT">Pet Transport</option>
          <option value="MOBILE_VET">Mobile Vet</option>
        </select>

        <input
          className="border p-2 rounded w-full"
          placeholder="Duration (minutes)"
          value={serviceForm.durationMinutes}
          onChange={(e) =>
            setServiceForm({
              ...serviceForm,
              durationMinutes: e.target.value,
            })
          }
        />

        <input
          className="border p-2 rounded w-full"
          placeholder="Price (ZAR)"
          value={serviceForm.basePrice}
          onChange={(e) =>
            setServiceForm({
              ...serviceForm,
              basePrice: e.target.value,
            })
          }
        />

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => addService.mutate()}
          disabled={addService.isPending}
          type="button"
        >
          {addService.isPending ? "Adding..." : "Add Service"}
        </button>

        <div className="space-y-2">
          {services.length === 0 ? (
            <p className="text-sm text-gray-500">No services added yet.</p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="border p-3 rounded">
                <p className="font-medium">{formatService(s.serviceType)}</p>
                <p className="text-sm text-gray-600">
                  {s.durationMinutes} min · R{s.basePrice}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOOKINGS */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Bookings</h2>

        {/* Pending */}
        <div className="space-y-3">
          <h3 className="font-semibold">Pending Bookings</h3>

          {grouped.pending.length === 0 ? (
            <p className="text-sm text-gray-500">No pending bookings.</p>
          ) : (
            grouped.pending.map((b) => (
              <div key={b.id} className="border p-3 rounded space-y-2">
                <p className="font-medium">{formatService(b.serviceType)}</p>
                <p>
                  <strong>Owner:</strong> {getOwnerName(b.owner)}
                </p>
                <p>
                  <strong>Dog(s):</strong> {getDogText(b)}
                </p>
                <p>
                  <strong>Suburb:</strong> {b.suburb || "—"}
                </p>
                <p>
                  <strong>When:</strong> {formatDate(b.startAt)}
                </p>
                <p>
                  <strong>Notes:</strong> {b.notes || "—"}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      bookingAction.mutate({ id: b.id, action: "accept" })
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    type="button"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() =>
                      bookingAction.mutate({ id: b.id, action: "decline" })
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    type="button"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Confirmed */}
        <div className="space-y-3">
          <h3 className="font-semibold">Confirmed Bookings</h3>

          {grouped.confirmed.length === 0 ? (
            <p className="text-sm text-gray-500">No confirmed bookings.</p>
          ) : (
            grouped.confirmed.map((b) => (
              <div key={b.id} className="border p-3 rounded space-y-2">
                <p className="font-medium">{formatService(b.serviceType)}</p>
                <p>
                  <strong>Owner:</strong> {getOwnerName(b.owner)}
                </p>
                <p>
                  <strong>Dog(s):</strong> {getDogText(b)}
                </p>
                <p>
                  <strong>Suburb:</strong> {b.suburb || "—"}
                </p>
                <p>
                  <strong>When:</strong> {formatDate(b.startAt)}
                </p>

                <button
                  onClick={() =>
                    bookingAction.mutate({ id: b.id, action: "start" })
                  }
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                  type="button"
                >
                  Start Job
                </button>
              </div>
            ))
          )}
        </div>

        {/* In Progress */}
        <div className="space-y-3">
          <h3 className="font-semibold">In Progress</h3>

          {grouped.inProgress.length === 0 ? (
            <p className="text-sm text-gray-500">No jobs in progress.</p>
          ) : (
            grouped.inProgress.map((b) => (
              <div key={b.id} className="border p-3 rounded space-y-2">
                <p className="font-medium">{formatService(b.serviceType)}</p>
                <p>
                  <strong>Owner:</strong> {getOwnerName(b.owner)}
                </p>
                <p>
                  <strong>Dog(s):</strong> {getDogText(b)}
                </p>
                <p>
                  <strong>Suburb:</strong> {b.suburb || "—"}
                </p>

                <button
                  onClick={() =>
                    bookingAction.mutate({ id: b.id, action: "complete" })
                  }
                  className="bg-purple-600 text-white px-3 py-1 rounded"
                  type="button"
                >
                  Complete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Completed Unbilled */}
        <div className="space-y-3">
          <h3 className="font-semibold">Completed Unbilled</h3>

          {grouped.completedUnbilled.length === 0 ? (
            <p className="text-sm text-gray-500">
              No completed unbilled bookings.
            </p>
          ) : (
            grouped.completedUnbilled.map((b) => (
              <div key={b.id} className="border p-3 rounded space-y-2">
                <p className="font-medium">{formatService(b.serviceType)}</p>
                <p>
                  <strong>Owner:</strong> {getOwnerName(b.owner)}
                </p>
                <p>
                  <strong>Dog(s):</strong> {getDogText(b)}
                </p>
                <p>
                  <strong>Suburb:</strong> {b.suburb || "—"}
                </p>

                <button
                  onClick={() =>
                    bookingAction.mutate({ id: b.id, action: "mark-paid" })
                  }
                  className="bg-amber-600 text-white px-3 py-1 rounded"
                  type="button"
                >
                  Mark Paid
                </button>
              </div>
            ))
          )}
        </div>

        {/* Completed */}
        <div className="space-y-3">
          <h3 className="font-semibold">Completed / Paid</h3>

          {grouped.completed.length === 0 ? (
            <p className="text-sm text-gray-500">No completed bookings.</p>
          ) : (
            grouped.completed.map((b) => (
              <div key={b.id} className="border p-3 rounded space-y-2">
                <p className="font-medium">{formatService(b.serviceType)}</p>
                <p>
                  <strong>Owner:</strong> {getOwnerName(b.owner)}
                </p>
                <p>
                  <strong>Dog(s):</strong> {getDogText(b)}
                </p>
                <p>
                  <strong>Suburb:</strong> {b.suburb || "—"}
                </p>
                <p>
                  <strong>When:</strong> {formatDate(b.startAt)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Cancelled */}
        <div className="space-y-3">
          <h3 className="font-semibold">Cancelled</h3>

          {grouped.cancelled.length === 0 ? (
            <p className="text-sm text-gray-500">No cancelled bookings.</p>
          ) : (
            grouped.cancelled.map((b) => (
              <div key={b.id} className="border p-3 rounded space-y-2">
                <p className="font-medium">{formatService(b.serviceType)}</p>
                <p>
                  <strong>Owner:</strong> {getOwnerName(b.owner)}
                </p>
                <p>
                  <strong>Dog(s):</strong> {getDogText(b)}
                </p>
                <p>
                  <strong>Suburb:</strong> {b.suburb || "—"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}