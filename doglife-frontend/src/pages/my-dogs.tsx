import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/owner/dogs"],
    queryFn: async () => {
      const res = await apiRequest("/api/owner/dogs");
      return res.json();
    },
  });

  const deleteDogMutation = useMutation({
  mutationFn: async (dogId: string) => {
    await apiRequest(`/api/owner/dogs/${dogId}`, {
      method: "DELETE",
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/owner/dogs"] });
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
  deleteDogMutation.mutate(dogId);
}; 

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header */}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Dogs</h1>

        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dog
        </Button>
      </div>

      {/* Dog Form */}

      {showForm && (
        <DogForm
          dog={editingDog}
          onClose={() => {
            setShowForm(false);
            setEditingDog(null);
          }}
        />
      )}

      {/* Dogs Grid */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

      {dogs.map((dog) => (
  <DogCard
    key={dog.id}
    dog={dog}
    onEdit={() => handleEditDog(dog)}
    onDelete={handleDeleteDog}
  />
))}  

      </div>
    </div>
  );
}