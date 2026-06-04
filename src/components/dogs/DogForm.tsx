import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";

const BREEDS = [
  "Affenpinscher",
  "Afghan Hound",
  "Africanis",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Bully",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Bearded Collie",
  "Belgian Malinois",
  "Belgian Shepherd",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Bloodhound",
  "Boerboel",
  "Border Collie",
  "Border Terrier",
  "Boston Terrier",
  "Bouvier des Flandres",
  "Boxer",
  "Bull Terrier",
  "Bulldog",
  "Bullmastiff",
  "Cairn Terrier",
  "Cane Corso",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chinese Crested",
  "Chow Chow",
  "Cocker Spaniel",
  "Collie",
  "Corgi",
  "Crossbreed",
  "Dachshund",
  "Dalmatian",
  "Doberman",
  "Dogo Argentino",
  "English Bulldog",
  "English Cocker Spaniel",
  "English Springer Spaniel",
  "Fox Terrier",
  "French Bulldog",
  "German Shepherd",
  "German Shorthaired Pointer",
  "Giant Schnauzer",
  "Golden Retriever",
  "Goldendoodle",
  "Great Dane",
  "Greyhound",
  "Havanese",
  "Husky",
  "Irish Setter",
  "Irish Terrier",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Japanese Spitz",
  "Labradoodle",
  "Labrador Retriever",
  "Maltese",
  "Mastiff",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Mixed Breed",
  "Newfoundland",
  "Old English Sheepdog",
  "Papillon",
  "Parson Russell Terrier",
  "Pekingese",
  "Pointer",
  "Pomeranian",
  "Poodle",
  "Portuguese Water Dog",
  "Pug",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Samoyed",
  "Schnauzer",
  "Scottish Terrier",
  "Shar Pei",
  "Shetland Sheepdog",
  "Shih Tzu",
  "Siberian Husky",
  "Staffordshire Bull Terrier",
  "St Bernard",
  "Toy Poodle",
  "Unknown",
  "Vizsla",
  "Weimaraner",
  "Welsh Corgi",
  "West Highland White Terrier",
  "Whippet",
  "Wire Fox Terrier",
  "Yorkshire Terrier",
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

function getDateInputClass(value?: string) {
  if (!value) return "w-full rounded border px-3 py-2";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return "w-full rounded border border-red-400 bg-red-50 px-3 py-2 text-red-700";
  }

  if (diffDays <= 30) {
    return "w-full rounded border border-yellow-400 bg-yellow-50 px-3 py-2 text-yellow-800";
  }

  return "w-full rounded border px-3 py-2";
}

function isValidSouthAfricanPhone(value: string) {
  if (!value?.trim()) return true;

  const cleaned = value.replace(/\s/g, "");

  return /^(\+27|0)[6-8][0-9]{8}$/.test(cleaned);
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
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
        dog?.isNeutered === true
          ? "true"
          : dog?.isNeutered === false
          ? "false"
          : "",
      isVaccinated:
        dog?.isVaccinated === true
          ? "true"
          : dog?.isVaccinated === false
          ? "false"
          : "",
      vaccinationExpiryDate: dateInputValue(dog?.vaccinationExpiryDate),
      kennelCoughAt: dateInputValue(dog?.kennelCoughAt),
      dewormedAt: dateInputValue(dog?.dewormedAt),
      tickFleaTreatedAt: dateInputValue(dog?.tickFleaTreatedAt),
      vetName: dog?.vetName || "",
      vetPhone: dog?.vetPhone || "",
      behavioralNotes: dog?.behavioralNotes || "",
      goodWithDogs:
        dog?.goodWithDogs === true
          ? "true"
          : dog?.goodWithDogs === false
          ? "false"
          : "",
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
      queryClient.invalidateQueries({
        queryKey: [`/api/owner/dogs/${dog?.id}`],
      });

      onClose();
    },
  });
    return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="mb-6 space-y-6 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="text-xl font-bold text-gray-900">
          Build your dog’s Dog Passport
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          A complete Dog Passport helps suppliers safely care for your dog and
          makes bookings smoother. Health, behaviour and emergency details are
          shared securely with suppliers when you book.
        </p>
      </div>

      <ImageUpload
        onUpload={setImageUrl}
        initialImage={imageUrl}
      />

      {/* BASIC DETAILS */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <SectionHeader
          title="Basic details"
          description="Tell suppliers who your dog is."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Dog name"
            {...form.register("name")}
            required
          />

          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Breed
  </label>
  <Input
    list="dog-breeds"
    placeholder="Start typing breed"
    {...form.register("breed")}
  />

  <datalist id="dog-breeds">
    {BREEDS.map((breed) => (
      <option key={breed} value={breed} />
    ))}
  </datalist>
</div>

          <Input
            type="date"
            {...form.register("dateOfBirth")}
          />

          <select
            {...form.register("size")}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">Select size</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="XL">XL</option>
          </select>

          <select
            {...form.register("sex")}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">Select sex</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>

          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Neutered / sterilised?
  </label>
  <select
    {...form.register("isNeutered")}
    className="w-full rounded border px-3 py-2"
  >
    <option value="">Select</option>
    <option value="true">Yes</option>
    <option value="false">No</option>
  </select>
</div>
        </div>
      </div>

      {/* HEALTH */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <SectionHeader
          title="Health & vaccinations"
          description="This helps suppliers keep all dogs safe."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Vaccinated?
  </label>
  <select
    {...form.register("isVaccinated")}
    className="w-full rounded border px-3 py-2"
  >
    <option value="">Select</option>
    <option value="true">Yes</option>
    <option value="false">No</option>
  </select>
</div>

          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Vaccination expiry
  </label>
  <Input
  type="date"
  className={getDateInputClass(form.watch("vaccinationExpiryDate"))}
  {...form.register("vaccinationExpiryDate")}
/>
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Kennel cough last done
  </label>
  <Input
    type="date"
    className="w-full rounded border px-3 py-2"
    {...form.register("kennelCoughAt")}
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Deworming last done
  </label>
  <Input
    type="date"
    className="w-full rounded border px-3 py-2"
    {...form.register("dewormedAt")}
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Tick & flea last treated
  </label>
  <Input
    type="date"
    className="w-full rounded border px-3 py-2"
    {...form.register("tickFleaTreatedAt")}
  />
</div>
</div>

        <p className="mt-3 text-xs text-gray-500">
          DogLife uses these dates to send reminders and help keep your Dog
          Passport supplier-ready.
        </p>
      </div>

      {/* BEHAVIOUR */}
<div className="rounded-2xl border border-gray-200 p-5">
  <SectionHeader
    title="Behaviour & socialisation"
    description="Help suppliers understand how to care for your dog."
  />

  <div className="grid gap-4 md:grid-cols-2">
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Good with dogs?
      </label>
      <select
        {...form.register("goodWithDogs")}
        className="w-full rounded border px-3 py-2"
      >
        <option value="">Select</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>

    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Good with children?
      </label>
      <select
        {...form.register("goodWithChildren")}
        className="w-full rounded border px-3 py-2"
      >
        <option value="">Select</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  </div>

  <textarea
    className="mt-4 min-h-[100px] w-full rounded border px-3 py-2"
    placeholder="Behaviour notes (e.g. anxious around strangers, escape artist, loves balls, nervous during storms)"
    {...form.register("behavioralNotes")}
  />
</div>

      {/* VET */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <SectionHeader
          title="Vet & emergency details"
          description="Important information suppliers may need in an emergency."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Vet name"
            {...form.register("vetName")}
          />

          <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Vet phone number
  </label>
  <Input
    placeholder="e.g. 0111234567 or +27111234567"
    {...form.register("vetPhone", {
      validate: (value) =>
        isValidSouthAfricanPhone(value) ||
        "Please enter a valid South African phone number.",
    })}
  />

  {form.formState.errors.vetPhone ? (
    <p className="mt-1 text-xs text-red-600">
      {form.formState.errors.vetPhone.message}
    </p>
  ) : null}
</div>

        <textarea
          className="mt-4 min-h-[100px] w-full rounded border px-3 py-2"
          placeholder="Medical notes (allergies, medication, injuries, sensitivities, conditions)"
          {...form.register("medicalNotes")}
        />
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          🐾 The more complete your Dog Passport, the easier it is for trusted
          suppliers to safely care for your dog.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? "Saving..."
            : dog?.id
            ? "Update Dog Passport"
            : "Save Dog Passport"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}