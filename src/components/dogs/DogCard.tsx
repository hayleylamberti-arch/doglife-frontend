import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, ShieldCheck, Trash2 } from "lucide-react";

function formatLabel(value?: string | null) {
  if (!value) return "Not added";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
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

function hasValue(value: unknown) {
  if (value === true || value === false) return true;
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
}

function getPassportScore(dog: any) {
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

function getPassportStatus(score: number) {
  if (score >= 85) {
    return {
      label: "Supplier-ready",
      className: "bg-green-100 text-green-700",
    };
  }

  if (score >= 55) {
    return {
      label: "Almost ready",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Needs details",
    className: "bg-orange-100 text-orange-700",
  };
}

export default function DogCard({ dog, onEdit, onDelete }: any) {
  const age = getAge(dog.dateOfBirth);
  const passportScore = getPassportScore(dog);
  const passportStatus = getPassportStatus(passportScore);

  return (
    <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {dog.profileImageUrl ? (
            <img
              src={dog.profileImageUrl}
              alt={dog.name}
              className="h-24 w-24 shrink-0 rounded-2xl border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border bg-gray-100 text-4xl">
              🐶
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="truncate text-xl font-bold text-gray-900">
                  {dog.name}
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  {dog.breed || "Breed not added"}
                </p>
              </div>

              <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {formatLabel(dog.size)}
              </span>

              {dog.sex ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {formatLabel(dog.sex)}
                </span>
              ) : null}

              {age ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {age}
                </span>
              ) : null}

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${passportStatus.className}`}
              >
                {passportStatus.label}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Dog Passport</span>
                <span>{passportScore}% complete</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${passportScore}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Shared with suppliers when you book, so they can safely care for{" "}
                {dog.name}.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="mr-1 h-4 w-4" />
                Update Passport
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dog.id);
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}