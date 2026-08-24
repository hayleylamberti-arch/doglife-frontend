import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus, Eye, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

import DogCard from "@/components/dogs/DogCard";
import DogForm from "@/components/dogs/DogForm";

type Dog = {
  id: string;
  name: string;
  breed?: string | null;
  size?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null;
  medicalNotes?: string | null;
  behavioralNotes?: string | null;
  isVaccinated?: boolean | null;
  vaccinationExpiryDate?: string | null;
  kennelCoughAt?: string | null;
  dewormedAt?: string | null;
  tickFleaTreatedAt?: string | null;
  vetName?: string | null;
  vetPhone?: string | null;
  goodWithDogs?: boolean | null;
  goodWithChildren?: boolean | null;
  profileImageUrl?: string | null;
};

export default function MyDogsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Dog | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<any>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["owner-dogs"],
    queryFn: async () => {
      const res = await api.get("/api/owner/dogs");
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteDogMutation = useMutation({
  mutationFn: async (dogId: string) => {
    await api.delete(`/api/owner/dogs/${dogId}`);
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });
    await refetch();
  },
});

  const dogs: Dog[] = data?.dogs || [];

  if (isLoading) {
    return <div className="p-10">Loading Dog Passports...</div>;
  }

  if (error) {
    return <div className="p-10 text-red-500">Failed to load Dog Passports</div>;
  }

  const handleEditDog = (dog: Dog) => {
    setEditingDog(dog);
    setShowForm(true);
  };

  const handleDeleteDog = (dogId: string) => {
    const dogToDelete = dogs.find((d) => d.id === dogId);
    if (!dogToDelete) return;

    const confirmed = window.confirm(`Delete ${dogToDelete.name}?`);
    if (!confirmed) return;

    queryClient.setQueryData(["owner-dogs"], (old: any) => {
      if (!old) return old;

      return {
        ...old,
        dogs: old.dogs.filter((d: any) => d.id !== dogId),
      };
    });

    setPendingDelete(dogToDelete);

    const timeout = setTimeout(() => {
      deleteDogMutation.mutate(dogId);
      setPendingDelete(null);
    }, 5000);

    setUndoTimeout(timeout);
  };

  const handleUndo = () => {
    if (!pendingDelete) return;

    clearTimeout(undoTimeout);

    queryClient.setQueryData(["owner-dogs"], (old: any) => {
      if (!old) return old;

      return {
        ...old,
        dogs: [pendingDelete, ...old.dogs],
      };
    });

    setPendingDelete(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Dog Passports
              </h1>
            </div>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Keep your dog’s health, care, behaviour and emergency information
              in one trusted place. Dog Passport details are shared with
              suppliers when you book so they can safely care for your dog.
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingDog(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Dog
          </Button>
        </div>
      </div>

      {dogs.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Dog Passports</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {dogs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Keep details up to date</p>
            <p className="mt-2 text-sm text-gray-700">
              Add or update health, care and vet information whenever it’s useful.
            </p>
          </div>
        </div>
      ) : null}

      {pendingDelete && (
        <div className="flex items-center justify-between rounded border bg-yellow-100 p-4">
          <span>{pendingDelete.name} deleted</span>
          <Button size="sm" onClick={handleUndo}>
            Undo
          </Button>
        </div>
      )}

      {showForm && (
  <DogForm
    dog={editingDog}
    onClose={async () => {
      setShowForm(false);
      setEditingDog(null);
      await queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });
      await refetch();
    }}
  />
)}

      {dogs.length === 0 && !showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
            🐶
          </div>

          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Create your first Dog Passport
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Add your dog’s health, care and behaviour details once, then use
            them when booking trusted DogLife suppliers.
          </p>

          <Button className="mt-5" onClick={() => setShowForm(true)}>
            Add your first dog
          </Button>
        </div>
      )}

      {dogs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dogs.map((dog) => (
            <div key={dog.id} className="space-y-3">
              <DogCard
                dog={dog}
                onEdit={() => handleEditDog(dog)}
                onDelete={handleDeleteDog}
              />

              <Link
                to={`/owner/dogs/${dog.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Eye className="h-4 w-4" />
                View Dog Passport
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}