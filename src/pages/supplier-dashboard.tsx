import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

/* Format service names */
function formatService(service: string) {
  const map: Record<string, string> = {
    WALKING: "🚶 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
    PET_SITTING: "🛏️ Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet"
  };

  return map[service] ?? service;
}

/* Friendly date formatting */
function formatBookingTime(dateString: string) {
  const date = new Date(dateString);

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (date.toDateString() === today.toDateString()) {
    return `Today • ${time}`;
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow • ${time}`;
  }

  return `${date.toLocaleDateString()} • ${time}`;
}

export default function SupplierDashboard() {

  /* Supplier profile */
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/profile");
      console.log("SUPPLIER DATA:", res.data);
      return res.data;
    }
  });

  /* Supplier bookings */
  const { data: bookingsData } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    }
  });

  console.log("DASHBOARD DATA:", data);

  /* ===============================
     SAFETY GUARDS (CRITICAL)
  =============================== */

  if (isLoading) {
    return <div className="p-10">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="p-10">No data available</div>;
  }

  // Safe profile extraction
  const supplier = data?.profile ?? {};

  // Safe bookings
  const bookings = Array.isArray(bookingsData?.bookings)
    ? bookingsData.bookings
    : [];

  const upcomingBookings = bookings
    .filter((b: any) => b?.status !== "CANCELLED")
    .sort(
      (a: any, b: any) =>
        new Date(a?.startAt).getTime() - new Date(b?.startAt).getTime()
    )
    .slice(0, 5);

  /* ===============================
     UI
  =============================== */

  return (
    <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-[240px_1fr] gap-8">

      {/* Sidebar */}
      <aside className="space-y-4">
        <h2 className="text-xl font-semibold">Supplier</h2>

        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/supplier-dashboard" className="px-3 py-2 rounded-md bg-blue-50 text-blue-700">
            Dashboard
          </Link>

          <Link to="/supplier-profile" className="px-3 py-2 rounded-md hover:bg-gray-100">
            Public Profile
          </Link>

          <Link to="/supplier-onboarding" className="px-3 py-2 rounded-md hover:bg-gray-100">
            Edit Business Info
          </Link>

          <Link to="/supplier-bookings" className="px-3 py-2 rounded-md hover:bg-gray-100">
            Booking Requests
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome {supplier?.businessName ? `, ${supplier.businessName}` : ""}
          </h1>

          <p className="text-muted-foreground text-sm mt-1">
            Manage your services, bookings and profile
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <p className="text-sm text-muted-foreground">Upcoming Bookings</p>
            <p className="text-2xl font-semibold">{upcomingBookings.length}</p>
          </div>

          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <p className="text-sm text-muted-foreground">Reviews</p>
            <p className="text-2xl font-semibold">⭐ 0</p>
          </div>

          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <p className="text-sm text-muted-foreground">Profile Views</p>
            <p className="text-2xl font-semibold">0</p>
          </div>
        </div>

        {/* Business Profile */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Business Profile</h2>

          <p className="text-lg font-medium">
            {supplier?.businessName || "Business name not set"}
          </p>

          <p className="text-sm text-muted-foreground">
            📍 {supplier?.suburb || "Location not set"}
          </p>

          <Link
            to="/supplier-onboarding"
            className="inline-block mt-4 text-sm text-blue-600 hover:underline"
          >
            Edit profile →
          </Link>
        </div>

        {/* Services */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Your Services</h2>

          {Array.isArray(supplier?.serviceTypes) && supplier.serviceTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {supplier.serviceTypes.map((service: string) => (
                <span
                  key={service}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {formatService(service)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No services added yet.
            </p>
          )}
        </div>

      </main>
    </div>
  );
}