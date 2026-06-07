import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, HeartPulse, AlertTriangle, CalendarDays } from "lucide-react";

type Dog = {
  id: string;
  name: string;
  breed?: string | null;
  dateOfBirth?: string | null;
  size?: string | null;
  weightKg?: number | null;
  sex?: string | null;
  isNeutered?: boolean | null;
  behavioralNotes?: string | null;
  goodWithDogs?: boolean | null;
  goodWithChildren?: boolean | null;
  medicalNotes?: string | null;
  isVaccinated?: boolean | null;
  vaccinationExpiryDate?: string | null;
  kennelCoughAt?: string | null;
  dewormedAt?: string | null;
  tickFleaTreatedAt?: string | null;
  vetName?: string | null;
  vetPhone?: string | null;
  profileImageUrl?: string | null;
};

type Activity = {
  id: number;
  date: string;
  type: string;
  notes: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Not added";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addDays(value?: string | null, days = 0) {
  if (!value) return null;
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function hasValue(value: unknown) {
  if (value === true || value === false) return true;
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
}

function getPassportScore(dog: Dog) {
  const fields = [
    dog.name,
    dog.breed,
    dog.dateOfBirth,
    dog.size,
    dog.sex,
    dog.isNeutered,
    dog.isVaccinated,
    dog.vaccinationExpiryDate,
    dog.kennelCoughAt,
    dog.dewormedAt,
    dog.tickFleaTreatedAt,
    dog.vetName,
    dog.vetPhone,
    dog.behavioralNotes,
    dog.medicalNotes,
    dog.goodWithDogs,
    dog.goodWithChildren,
  ];

  const completed = fields.filter(hasValue).length;
  return Math.round((completed / fields.length) * 100);
}

function getAge(value?: string | null) {
  if (!value) return "Age not added";

  const birthDate = new Date(value);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    years -= 1;
  }

  if (years <= 0) return "Under 1 year";
  if (years === 1) return "1 year old";
  return `${years} years old`;
}

function yesNo(value?: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not added";
}

function getDueStatus(date?: string | null) {
  if (!date) {
    return {
      label: "Not added",
      className: "bg-gray-100 text-gray-700",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    };
  }

  if (diffDays <= 14) {
    return {
      label: "Due soon",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Up to date",
    className: "bg-green-100 text-green-700",
  };
}

function HealthCard({
  title,
  date,
  note,
}: {
  title: string;
  date?: string | null;
  note?: string;
}) {
  const status = getDueStatus(date);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{formatDate(date)}</p>
          {note ? <p className="mt-1 text-xs text-gray-500">{note}</p> : null}
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}

export default function DogProfilePage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/owner/dogs/${id}`],
    queryFn: async () => {
      const res = await apiRequest(`/api/owner/dogs/${id}`);
      return res.json();
    },
  });

  const dog: Dog | undefined = data?.dog || data?.data?.dog || data?.data || data;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    date: "",
    type: "",
    notes: "",
  });

  const reminders = useMemo(() => {
    if (!dog) return [];

    return [
      {
        title: "Core vaccinations",
        date: dog.vaccinationExpiryDate,
        note: "Usually updated annually depending on vet guidance.",
      },
      {
        title: "Kennel cough",
        date: addDays(dog.kennelCoughAt, 365),
        note: dog.kennelCoughAt
          ? `Last done: ${formatDate(dog.kennelCoughAt)}`
          : "Add last kennel cough date.",
      },
      {
        title: "Deworming",
        date: addDays(dog.dewormedAt, 90),
        note: dog.dewormedAt
          ? `Last done: ${formatDate(dog.dewormedAt)}`
          : "Add last deworming date.",
      },
      {
        title: "Tick and flea",
        date: addDays(dog.tickFleaTreatedAt, 30),
        note: dog.tickFleaTreatedAt
          ? `Last done: ${formatDate(dog.tickFleaTreatedAt)}`
          : "Add last tick and flea treatment date.",
      },
    ];
  }, [dog]);

  const birthdayAlert = useMemo(() => {
    if (!dog?.dateOfBirth) return null;

    const today = new Date();
    const birthday = new Date(dog.dateOfBirth);

    if (
      today.getDate() === birthday.getDate() &&
      today.getMonth() === birthday.getMonth()
    ) {
      return `🎂 Happy birthday, ${dog.name}!`;
    }

    return null;
  }, [dog]);

  const addActivity = () => {
    if (!newActivity.type.trim()) return;

    setActivities([
      {
        id: Date.now(),
        date: newActivity.date || formatDate(new Date().toISOString()),
        type: newActivity.type,
        notes: newActivity.notes,
      },
      ...activities,
    ]);

    setNewActivity({ date: "", type: "", notes: "" });
    setShowForm(false);
  };

  if (isLoading) return <div className="p-10">Loading Dog Passport...</div>;
  if (!dog) return <div className="p-10">Dog not found</div>;

  const passportScore = getPassportScore(dog);
  const supplierReady = passportScore >= 85;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {birthdayAlert ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          {birthdayAlert}
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {dog.profileImageUrl ? (
            <img
              src={dog.profileImageUrl}
              alt={dog.name}
              className="h-36 w-36 rounded-full border object-cover"
            />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white text-5xl">
              🐶
            </div>
          )}

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {dog.name}’s Dog Passport
          </h1>

          <p className="mt-2 text-gray-600">
          {dog.breed || "Breed not added"} •{" "}
          {dog.size || "Size not added"} •{" "}
          {dog.weightKg ? `${dog.weightKg}kg` : "Weight not added"} •{" "}
          {dog.sex || "Sex not added"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Birthday: {formatDate(dog.dateOfBirth)} • {getAge(dog.dateOfBirth)}
          </p>

          <div className="mt-5 w-full max-w-md">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Passport completeness</span>
              <span className="font-semibold">{passportScore}%</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${passportScore}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {supplierReady
                ? "This passport is supplier-ready and helps providers safely care for your dog."
                : "Add more health, behaviour and vet details to make this passport supplier-ready."}
            </p>
          </div>

          <Link
            to="/owner/my-dogs"
            className="mt-4 text-sm font-medium text-blue-700 underline"
          >
            Back to Dog Passports
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-green-700" />
          <div>
            <h2 className="font-semibold text-green-900">
              Shared with suppliers when you book
            </h2>
            <p className="mt-1 text-sm text-green-800">
              DogLife shares relevant Dog Passport information with suppliers
              involved in your booking, including health, care, behaviour and
              emergency details needed to safely care for {dog.name}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <HeartPulse className="h-5 w-5 text-red-500" />
          <p className="mt-3 text-sm text-gray-500">Vaccinated</p>
          <p className="text-lg font-semibold text-gray-900">
            {yesNo(dog.isVaccinated)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <p className="mt-3 text-sm text-gray-500">Behaviour notes</p>
          <p className="text-lg font-semibold text-gray-900">
            {dog.behavioralNotes ? "Added" : "Not added"}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          <p className="mt-3 text-sm text-gray-500">Vet details</p>
          <p className="text-lg font-semibold text-gray-900">
            {dog.vetName || dog.vetPhone ? "Added" : "Not added"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reminders.map((reminder) => (
          <HealthCard
            key={reminder.title}
            title={`${reminder.title} due`}
            date={reminder.date}
            note={reminder.note}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Behaviour & care notes
          </h2>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p>Good with dogs: {yesNo(dog.goodWithDogs)}</p>
            <p>Good with children: {yesNo(dog.goodWithChildren)}</p>
            <p>Neutered: {yesNo(dog.isNeutered)}</p>
            <p className="whitespace-pre-line">
              Notes: {dog.behavioralNotes || "No behaviour notes added."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Emergency & vet details
          </h2>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p>Vet name: {dog.vetName || "Not added"}</p>
            <p>Vet phone: {dog.vetPhone || "Not added"}</p>
            <p className="whitespace-pre-line">
              Medical notes: {dog.medicalNotes || "No medical notes added."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Passport activity
          </h2>

          <button
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            onClick={() => setShowForm(true)}
          >
            + Add Activity
          </button>
        </div>

        {showForm ? (
          <div className="mb-6 space-y-3 rounded-xl border border-gray-200 p-4">
            <input
              className="w-full rounded border px-3 py-2"
              type="date"
              value={newActivity.date}
              onChange={(e) =>
                setNewActivity({ ...newActivity, date: e.target.value })
              }
            />

            <select
              className="w-full rounded border px-3 py-2"
              value={newActivity.type}
              onChange={(e) =>
                setNewActivity({ ...newActivity, type: e.target.value })
              }
            >
              <option value="">Select activity</option>
              <option value="Vet visit">Vet visit</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Medication">Medication</option>
              <option value="Deworming">Deworming</option>
              <option value="Tick and flea">Tick and flea</option>
              <option value="Note">Note</option>
            </select>

            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Notes"
              value={newActivity.notes}
              onChange={(e) =>
                setNewActivity({ ...newActivity, notes: e.target.value })
              }
            />

            <div className="flex gap-3">
              <button
                className="rounded bg-black px-4 py-2 text-white"
                onClick={addActivity}
              >
                Save Activity
              </button>

              <button
                className="rounded border px-4 py-2"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">
            No activity added yet. Add vet visits, treatments, medication or
            notes here.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <p className="text-sm text-gray-500">{activity.date}</p>
                <p className="font-medium text-gray-900">{activity.type}</p>
                <p className="text-sm text-gray-700">{activity.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}