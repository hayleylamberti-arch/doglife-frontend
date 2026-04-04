import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Dashboard() {
  // 🔹 Fetch dogs (safe even if empty)
  const { data: dogs = [], isLoading } = useQuery({
    queryKey: ["my-dogs"],
    queryFn: async () => {
      const res = await api.get("/api/owner/dogs");
      return res.data?.dogs ?? [];
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      {/* ========================= */}
      {/* PAGE TITLE */}
      {/* ========================= */}
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* ========================= */}
      {/* HEALTH ALERTS */}
      {/* ========================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Health Alerts</h2>
        <p className="text-gray-500">No alerts today</p>
      </div>

      {/* ========================= */}
      {/* YOUR DOGS */}
      {/* ========================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Your Dogs</h2>

        {dogs.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded">
            <p className="mb-2">You haven’t added any dogs yet.</p>
            <Link to="/owner/my-dogs" className="text-blue-600">
              Add your first dog →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dogs.map((dog: any) => (
              <div key={dog.id} className="p-4 border rounded">
                <p className="font-medium">{dog.name}</p>
                <p className="text-sm text-gray-500">
                  No alerts today
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* UPCOMING BOOKINGS */}
      {/* ========================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Upcoming Bookings</h2>

        <div className="p-4 bg-gray-50 rounded">
          <p className="mb-2">No upcoming bookings</p>
          <Link to="/search" className="text-blue-600">
            Book a service →
          </Link>
        </div>
      </div>

      {/* ========================= */}
      {/* CTA */}
      {/* ========================= */}
      <div className="p-5 bg-orange-50 rounded-lg text-center">
        <h3 className="font-semibold mb-2">
          Need help with your dog?
        </h3>

        <Link
          to="/search"
          className="inline-block mt-2 bg-orange-500 text-white px-4 py-2 rounded"
        >
          Find a service
        </Link>
      </div>

    </div>
  );
}