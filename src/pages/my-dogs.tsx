import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { api } from "@/lib/api";

import DogCard from "@/components/dogs/DogCard";
import DogForm from "@/components/dogs/DogForm";

type Dog = {
  id: string;
  name: string;
  breed?: string;
  gender?: string;
  size?: string;
  dateOfBirth?: string;
  medicalNotes?: string;
  profileImageUrl?: string;
};

export default function MyDogsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Dog | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
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
    },
  });

  const dogs: Dog[] = data?.dogs || [];

  if (isLoading) {
    return <div className="p-10">Loading dogs...</div>;
  }

  if (error) {
    return <div className="p-10 text-red-500">Failed to load dogs</div>;
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
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Dogs</h1>

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

      {pendingDelete && (
        <div className="mb-4 p-4 bg-yellow-100 border rounded flex justify-between items-center">
          <span>{pendingDelete.name} deleted</span>
          <Button size="sm" onClick={handleUndo}>
            Undo
          </Button>
        </div>
      )}

      {showForm && (
        <DogForm
          dog={editingDog}
          onClose={() => {
            setShowForm(false);
            setEditingDog(null);
            queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });
          }}
        />
      )}

      {dogs.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No dogs added yet.</p>
          <Button onClick={() => setShowForm(true)}>
            Add your first dog
          </Button>
        </div>
      )}

      {dogs.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <div key={dog.id} className="space-y-3">
              <DogCard
                dog={dog}
                onEdit={() => handleEditDog(dog)}
                onDelete={handleDeleteDog}
              />

              <Link
                to={`/owner/dogs/${dog.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Eye className="h-4 w-4" />
                View health profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}