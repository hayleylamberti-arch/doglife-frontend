import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

/* Format service names */
function formatService(service: string) {
  const map: Record<string, string> = {
    WALKING: "🐕 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
    PET_SITTING: "🛋️ Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet",
  };

  return map[service] ?? service;
}

export default function SupplierDashboard() {
  const queryClient = useQueryClient();

  /* ================================
     DATA FETCHING
  ================================ */

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      return res.data;
    },
  });

  const { data: bookingsData } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    },
  });

  /* ================================
     ACTIONS (API CALLS)
  ================================ */

  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-bookings"] });
  };

  const acceptBooking = async (id: string) => {
    await api.patch(`/api/supplier/bookings/${id}/accept`);
    refreshBookings();
  };

  const declineBooking = async (id: string) => {
    await api.patch(`/api/supplier/bookings/${id}/decline`);
    refreshBookings();
  };

  const startBooking = async (id: string) => {
    await api.patch(`/api/supplier/bookings/${id}/start`);
    refreshBookings();
  };

  const completeBooking = async (id: string) => {
    await api.patch(`/api/bookings/${id}/complete`);
    refreshBookings();
  };

  const markPaid = async (id: string) => {
    await api.patch(`/api/bookings/${id}/mark-paid`);
    refreshBookings();
  };

  /* ================================
     SAFETY GUARDS
  ================================ */

  if (isLoading) {
    return <div className="p-10">Loading dashboard...</div>;
  }

  if (!data || typeof data !== "object") {
    return <div className="p-10">No data available</div>;
  }

  /* ================================
     SAFE DATA EXTRACTION
  ================================ */

  const supplier =
    typeof data.profile === "object" && data.profile !== null
      ? data.profile
      : {};

  const safeBusinessName =
    typeof supplier.businessName === "string"
      ? supplier.businessName
      : "";

  const safeSuburb =
    typeof supplier.suburb === "string" ? supplier.suburb : "";

  const safeServices = Array.isArray(supplier.serviceTypes)
    ? supplier.serviceTypes
    : [];

  const bookings = Array.isArray(bookingsData?.bookings)
    ? bookingsData.bookings
    : [];

  /* ================================
     BOOKING GROUPS
  ================================ */

  const pending = bookings.filter((b: any) => b.status === "PENDING");
  const confirmed = bookings.filter((b: any) => b.status === "CONFIRMED");
  const inProgress = bookings.filter((b: any) => b.status === "IN_PROGRESS");
  const unpaid = bookings.filter(
    (b: any) => b.status === "COMPLETED_UNBILLED"
  );
  const completed = bookings.filter((b: any) => b.status === "COMPLETED");

  /* ================================
     UI HELPERS
  ================================ */

  const BookingCard = ({ b }: { b: any }) => (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <p className="font-medium">{b.serviceType}</p>
      <p className="text-sm text-muted-foreground">
        {new Date(b.startAt).toLocaleString()}
      </p>

      <div className="flex gap-2 mt-3 flex-wrap">
        {b.status === "PENDING" && (
          <>
            <button
              onClick={() => acceptBooking(b.id)}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Accept
            </button>
            <button
              onClick={() => declineBooking(b.id)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Decline
            </button>
          </>
        )}

        {b.status === "CONFIRMED" && (
          <button
            onClick={() => startBooking(b.id)}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Start
          </button>
        )}

        {b.status === "IN_PROGRESS" && (
          <button
            onClick={() => completeBooking(b.id)}
            className="px-3 py-1 bg-purple-600 text-white rounded"
          >
            Complete
          </button>
        )}

        {b.status === "COMPLETED_UNBILLED" && (
          <button
            onClick={() => markPaid(b.id)}
            className="px-3 py-1 bg-yellow-600 text-white rounded"
          >
            Mark Paid
          </button>
        )}
      </div>
    </div>
  );

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-[240px_1fr] gap-8">
      {/* Sidebar */}
      <aside className="space-y-4">
        <h2 className="text-xl font-semibold">Supplier</h2>

        <nav className="flex flex-col gap-2 text-sm">
          <Link
            to="/supplier-dashboard"
            className="px-3 py-2 rounded-md bg-blue-50 text-blue-700"
          >
            Dashboard
          </Link>

          {supplier && typeof supplier.id === "string" && (
            <Link
              to={`/supplier/${supplier.id}`}
              className="px-3 py-2 rounded-md hover:bg-gray-100"
            >
              Public Profile
            </Link>
          )}

          <Link
            to="/supplier-onboarding"
            className="px-3 py-2 rounded-md hover:bg-gray-100"
          >
            Edit Business Info
          </Link>

          <Link
            to="/supplier-bookings"
            className="px-3 py-2 rounded-md hover:bg-gray-100"
          >
            Booking Requests
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome {safeBusinessName ? `, ${safeBusinessName}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your bookings and services
          </p>
        </div>

        {/* Booking Sections */}

        {/* Pending */}
        <Section title="🟡 Pending Requests" items={pending} />

        {/* Confirmed */}
        <Section title="🔵 Confirmed Bookings" items={confirmed} />

        {/* In Progress */}
        <Section title="🟣 In Progress" items={inProgress} />

        {/* Awaiting Payment */}
        <Section title="🟠 Awaiting Payment" items={unpaid} />

        {/* Completed */}
        <Section title="🟢 Completed" items={completed} />
      </main>
    </div>
  );

  /* ================================
     SECTION COMPONENT
  ================================ */

  function Section({ title, items }: any) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{title}</h2>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((b: any) => (
              <BookingCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>
    );
  }
}