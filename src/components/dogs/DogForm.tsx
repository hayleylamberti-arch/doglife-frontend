import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";

const BREEDS = [
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Bulldog",
  "Poodle",
  "Beagle",
  "Rottweiler",
  "Yorkshire Terrier",
  "Boxer",
  "Dachshund",
  "Springer Spaniel",
  "Other",
];

type DogFormValues = {
  name: string;
  breed: string;
  dateOfBirth: string;
  size: string;
  sex: string;
  isNeutered: string;
  isVaccinated: string;
  vaccinationExpiryDate: string;
  kennelCoughAt: string;
  dewormedAt: string;
  tickFleaTreatedAt: string;
  vetName: string;
  vetPhone: string;
  behavioralNotes: string;
  goodWithDogs: string;
  goodWithChildren: string;
  medicalNotes: string;
};

function emptyToNull(value: string) {
  return value?.trim() ? value.trim() : null;
}

function booleanFromSelect(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function dateOrNull(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

function dateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function DogForm({ dog, onClose }: any) {
  const [imageUrl, setImageUrl] = useState<string>(dog?.profileImageUrl || "");

  const form = useForm<DogFormValues>({
    defaultValues: {
      name: dog?.name || "",
      breed: dog?.breed || "",
      dateOfBirth: dateInputValue(dog?.dateOfBirth),
      size: dog?.size || "",
      sex: dog?.sex || "",
      isNeutered:
        dog?.isNeutered === true ? "true" : dog?.isNeutered === false ? "false" : "",
      isVaccinated:
        dog?.isVaccinated === true ? "true" : dog?.isVaccinated === false ? "false" : "",
      vaccinationExpiryDate: dateInputValue(dog?.vaccinationExpiryDate),
      kennelCoughAt: dateInputValue(dog?.kennelCoughAt),
      dewormedAt: dateInputValue(dog?.dewormedAt),
      tickFleaTreatedAt: dateInputValue(dog?.tickFleaTreatedAt),
      vetName: dog?.vetName || "",
      vetPhone: dog?.vetPhone || "",
      behavioralNotes: dog?.behavioralNotes || "",
      goodWithDogs:
        dog?.goodWithDogs === true ? "true" : dog?.goodWithDogs === false ? "false" : "",
      goodWithChildren:
        dog?.goodWithChildren === true
          ? "true"
          : dog?.goodWithChildren === false
          ? "false"
          : "",
      medicalNotes: dog?.medicalNotes || "",
    },
  });

  useEffect(() => {
    if (dog?.profileImageUrl) {
      setImageUrl(dog.profileImageUrl);
    }
  }, [dog]);

  const mutation = useMutation({
    mutationFn: async (values: DogFormValues) => {
      const payload = {
        name: emptyToNull(values.name),
        breed: emptyToNull(values.breed),
        profileImageUrl: imageUrl || null,
        dateOfBirth: dateOrNull(values.dateOfBirth),
        size: emptyToNull(values.size),
        sex: emptyToNull(values.sex),
        isNeutered: booleanFromSelect(values.isNeutered),
        isVaccinated: booleanFromSelect(values.isVaccinated),
        vaccinationExpiryDate: dateOrNull(values.vaccinationExpiryDate),
        kennelCoughAt: dateOrNull(values.kennelCoughAt),
        dewormedAt: dateOrNull(values.dewormedAt),
        tickFleaTreatedAt: dateOrNull(values.tickFleaTreatedAt),
        vetName: emptyToNull(values.vetName),
        vetPhone: emptyToNull(values.vetPhone),
        behavioralNotes: emptyToNull(values.behavioralNotes),
        goodWithDogs: booleanFromSelect(values.goodWithDogs),
        goodWithChildren: booleanFromSelect(values.goodWithChildren),
        medicalNotes: emptyToNull(values.medicalNotes),
      };

      const res = await apiRequest(
        dog?.id ? `/api/owner/dogs/${dog.id}` : "/api/owner/dogs",
        {
          method: dog?.id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      return res.json();
    },

    onSuccess: (response) => {
      const newDog = response?.dog;

      queryClient.setQueryData(["owner-dogs"], (old: any) => {
        if (!old || !newDog) return old;

        if (dog?.id) {
          return {
            ...old,
            dogs: old.dogs.map((d: any) => (d.id === dog.id ? newDog : d)),
          };
        }

        return {
          ...old,
          dogs: [newDog, ...old.dogs],
        };
      });

      queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/owner/dogs/${dog?.id}`] });

      onClose();
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="mb-6 space-y-6 rounded-2xl bg-white p-6 shadow-sm"
    >
      <ImageUpload onUpload={setImageUrl} initialImage={imageUrl} />

      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Dog name" {...form.register("name")} required />

        <select {...form.register("breed")} className="w-full rounded border px-3 py-2">
          <option value="">Select breed</option>
          {BREEDS.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>

        <Input type="date" {...form.register("dateOfBirth")} />

        <select {...form.register("size")} className="w-full rounded border px-3 py-2">
          <option value="">Select size</option>
          <option value="SMALL">Small</option>
          <option value="MEDIUM">Medium</option>
          <option value="LARGE">Large</option>
          <option value="XL">XL</option>
        </select>

        <select {...form.register("sex")} className="w-full rounded border px-3 py-2">
          <option value="">Select sex</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>

        <select {...form.register("isNeutered")} className="w-full rounded border px-3 py-2">
          <option value="">Neutered?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-4 font-semibold text-gray-900">Health reminders</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <select {...form.register("isVaccinated")} className="w-full rounded border px-3 py-2">
            <option value="">Vaccinated?</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <Input type="date" {...form.register("vaccinationExpiryDate")} />

          <Input type="date" {...form.register("kennelCoughAt")} />
          <Input type="date" {...form.register("dewormedAt")} />
          <Input type="date" {...form.register("tickFleaTreatedAt")} />
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Dates are used to show vaccination, kennel cough, deworming, and tick/flea reminders.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Vet name" {...form.register("vetName")} />
        <Input placeholder="Vet phone" {...form.register("vetPhone")} />

        <select {...form.register("goodWithDogs")} className="w-full rounded border px-3 py-2">
          <option value="">Good with dogs?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        <select {...form.register("goodWithChildren")} className="w-full rounded border px-3 py-2">
          <option value="">Good with children?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <textarea
        className="min-h-[90px] w-full rounded border px-3 py-2"
        placeholder="Behaviour notes"
        {...form.register("behavioralNotes")}
      />

      <textarea
        className="min-h-[90px] w-full rounded border px-3 py-2"
        placeholder="Medical notes"
        {...form.register("medicalNotes")}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : dog?.id ? "Update Dog" : "Save Dog"}
        </Button>

        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}