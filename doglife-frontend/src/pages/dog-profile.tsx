import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type Dog = {
  id: string;
  name: string;
  breed: string;
  gender?: string;
  size?: string;
  dateOfBirth?: string;
  medicalNotes?: string;
  profileImageUrl?: string;
};

type Activity = {
  id: number;
  date: string;
  type: string;
  notes: string;
  weight?: number;
};

export default function DogProfilePage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/owner/dogs/${id}`],
    queryFn: async () => {
      const res = await apiRequest(`/api/owner/dogs/${id}`);
      return res.json();
    }
  });

  const dog: Dog = data?.dog;

  const [showForm, setShowForm] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, date: "May 12", type: "🩺 Vet Visit", notes: "Annual Checkup" },
    { id: 2, date: "May 10", type: "💉 Vaccination", notes: "Rabies" },
    { id: 3, date: "May 5", type: "📝 Note", notes: "Limp after long walk" },
    { id: 4, date: "May 1", type: "⚖️ Weight", notes: "Weigh-in", weight: 24 },
    { id: 5, date: "Apr 20", type: "🪱 Deworming", notes: "Milbemax tablet" },
    { id: 6, date: "Apr 10", type: "🦟 Flea & Tick", notes: "Frontline applied" }
  ]);

  const [newActivity, setNewActivity] = useState({
    date: "",
    type: "",
    notes: "",
    weight: ""
  });

  const addActivity = () => {
    if (!newActivity.type) return;

    const activity: Activity = {
      id: Date.now(),
      date: newActivity.date,
      type: newActivity.type,
      notes: newActivity.notes,
      weight: newActivity.weight ? Number(newActivity.weight) : undefined
    };

    setActivities([activity, ...activities]);

    setNewActivity({
      date: "",
      type: "",
      notes: "",
      weight: ""
    });

    setShowForm(false);
  };

  const deleteActivity = (id: number) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const weightData = activities
    .filter((a) => a.weight)
    .map((a) => ({
      date: a.date,
      weight: a.weight
    }));

  const today = new Date();

  const isBirthday =
    dog?.dateOfBirth &&
    new Date(dog.dateOfBirth).getDate() === today.getDate() &&
    new Date(dog.dateOfBirth).getMonth() === today.getMonth();

  const alerts: string[] = [];

  if (isBirthday) {
    alerts.push(`🎂 Happy Birthday ${dog?.name}!`);
  }

  const lastDeworm = activities.find((a) =>
    a.type.includes("Deworming")
  );

  const lastFlea = activities.find((a) =>
    a.type.includes("Flea")
  );

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toDateString();
  };

  if (lastDeworm) {
    alerts.push(`🪱 Next Deworming Due: ${addDays(today, 90)}`);
  }

  if (lastFlea) {
    alerts.push(`🦟 Next Flea Treatment Due: ${addDays(today, 30)}`);
  }

  if (isLoading) {
    return <div className="p-10">Loading dog...</div>;
  }

  if (!dog) {
    return <div className="p-10">Dog not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">

      {alerts.length > 0 && (
        <div className="mb-8 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm"
            >
              {alert}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center text-center mb-10">

        {dog.profileImageUrl ? (
          <img
            src={dog.profileImageUrl}
            alt={dog.name}
            className="w-40 h-40 rounded-full object-cover border mb-4"
          />
        ) : (
          <div className="w-40 h-40 rounded-full flex items-center justify-center bg-gray-100 text-4xl mb-4">
            🐶
          </div>
        )}

        <h1 className="text-3xl font-bold">{dog.name}</h1>

        <p className="text-gray-500 mt-1">
          {dog.breed} • {dog.size || "Unknown size"} • {dog.gender || "Unknown"}
        </p>

      </div>

      {weightData.length > 0 && (
        <div className="mb-12">

          <h2 className="text-xl font-semibold mb-4">Weight Tracking</h2>

          <div className="border rounded-lg p-4">

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#000"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>

        </div>
      )}

      <div className="mt-12">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Activity</h2>

          <button
            className="bg-black text-white px-4 py-2 rounded-md text-sm"
            onClick={() => setShowForm(true)}
          >
            + Add Activity
          </button>
        </div>

        {showForm && (
          <div className="border rounded-lg p-4 mb-6 space-y-3">

            <input
              className="border p-2 w-full rounded"
              placeholder="Date"
              value={newActivity.date}
              onChange={(e) =>
                setNewActivity({ ...newActivity, date: e.target.value })
              }
            />

            <select
              className="border p-2 w-full rounded"
              value={newActivity.type}
              onChange={(e) =>
                setNewActivity({ ...newActivity, type: e.target.value })
              }
            >
              <option value="">Select activity</option>
              <option value="🩺 Vet Visit">Vet Visit</option>
              <option value="💉 Vaccination">Vaccination</option>
              <option value="💊 Medication">Medication</option>
              <option value="⚖️ Weight">Weight</option>
              <option value="🪱 Deworming">Deworming</option>
              <option value="🦟 Flea & Tick">Flea & Tick Treatment</option>
              <option value="📝 Note">Note</option>
            </select>

            {newActivity.type === "⚖️ Weight" && (
              <input
                className="border p-2 w-full rounded"
                placeholder="Weight (kg)"
                value={newActivity.weight}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, weight: e.target.value })
                }
              />
            )}

            <input
              className="border p-2 w-full rounded"
              placeholder="Notes"
              value={newActivity.notes}
              onChange={(e) =>
                setNewActivity({ ...newActivity, notes: e.target.value })
              }
            />

            <div className="flex gap-3">

              <button
                className="bg-black text-white px-4 py-2 rounded"
                onClick={addActivity}
              >
                Save Activity
              </button>

              <button
                className="border px-4 py-2 rounded"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

            </div>

          </div>
        )}

        <div className="space-y-4">

          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >

              <div>
                <p className="text-sm text-gray-500">{activity.date}</p>
                <p className="font-medium">
                  {activity.type} • {activity.notes}
                </p>
              </div>

              <button
                className="text-red-500 text-sm"
                onClick={() => deleteActivity(activity.id)}
              >
                Delete
              </button>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}