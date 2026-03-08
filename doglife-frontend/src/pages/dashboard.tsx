import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Dog = {
  id: string;
  name: string;
  breed: string;
  dateOfBirth?: string;
};

export default function Dashboard() {

  const { data, isLoading } = useQuery({
    queryKey: ["/api/owner/dogs"],
    queryFn: async () => {
      const res = await apiRequest("/api/owner/dogs");
      return res.json();
    }
  });

  const dogs: Dog[] = data?.dogs || [];

  const today = new Date();

  const alerts: string[] = [];

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  dogs.forEach((dog) => {

    // Birthday detection
    if (dog.dateOfBirth) {
      const dob = new Date(dog.dateOfBirth);

      if (
        dob.getDate() === today.getDate() &&
        dob.getMonth() === today.getMonth()
      ) {
        alerts.push(`🎂 Today is ${dog.name}'s birthday!`);
      }
    }

    // Example reminder alerts (placeholder logic)
    const nextFlea = addDays(today, 30);
    const nextDeworm = addDays(today, 90);

    alerts.push(`🦟 ${dog.name}: Flea treatment due ${nextFlea.toDateString()}`);
    alerts.push(`🪱 ${dog.name}: Deworming due ${nextDeworm.toDateString()}`);

  });

  if (isLoading) {
    return <div className="p-10">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      {/* Alerts */}
      <div className="mb-10">

        <h2 className="text-xl font-semibold mb-4">
          Health Alerts
        </h2>

        {alerts.length === 0 ? (
          <div className="text-gray-500">
            No alerts today
          </div>
        ) : (
          <div className="space-y-3">

            {alerts.map((alert, index) => (
              <div
                key={index}
                className="border border-yellow-200 bg-yellow-50 p-4 rounded-md"
              >
                {alert}
              </div>
            ))}

          </div>
        )}

      </div>

      {/* Dogs */}
      <div>

        <h2 className="text-xl font-semibold mb-4">
          Your Dogs
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {dogs.map((dog) => (
            <div
              key={dog.id}
              className="border rounded-lg p-4"
            >

              <h3 className="font-semibold text-lg">
                {dog.name}
              </h3>

              <p className="text-gray-500 text-sm">
                {dog.breed}
              </p>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}