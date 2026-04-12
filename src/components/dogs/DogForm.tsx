import { useState, useEffect } from "react";
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

export default function DogForm({ dog, onClose }: any) {

  const [imageUrl, setImageUrl] = useState<string>(dog?.profileImageUrl || "");

  const form = useForm({
    defaultValues: {
      name: dog?.name || "",
      breed: dog?.breed || "",
    },
  });

  // 🔥 Keep image when editing
  useEffect(() => {
    if (dog?.profileImageUrl) {
      setImageUrl(dog.profileImageUrl);
    }
  }, [dog]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (dog?.id) {
        const res = await apiRequest(`/api/owner/dogs/${dog.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        return res.json();
      } else {
        const res = await apiRequest("/api/owner/dogs", {
          method: "POST",
          body: JSON.stringify(data),
        });
        return res.json();
      }
    },

    onSuccess: (response) => {
      const newDog = response?.dog;

      // 🔥 INSTANT UI UPDATE
      queryClient.setQueryData(["owner-dogs"], (old: any) => {
        if (!old) return old;

        if (dog?.id) {
          // UPDATE
          return {
            ...old,
            dogs: old.dogs.map((d: any) =>
              d.id === dog.id ? newDog : d
            ),
          };
        } else {
          // CREATE
          return {
            ...old,
            dogs: [newDog, ...old.dogs],
          };
        }
      });

      // 🔥 BACKGROUND SYNC
      queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });

      onClose();
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        mutation.mutate({
          ...data,
          profileImageUrl: imageUrl,
        })
      )}
      className="mb-6 space-y-4"
    >
      {/* IMAGE */}
      <ImageUpload onUpload={setImageUrl} initialImage={imageUrl} />

      {/* NAME */}
      <Input placeholder="Dog name" {...form.register("name")} />

      {/* BREED DROPDOWN */}
      <select
        {...form.register("breed")}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select breed</option>
        {BREEDS.map((breed) => (
          <option key={breed} value={breed}>
            {breed}
          </option>
        ))}
      </select>

      <Button type="submit">
        {dog?.id ? "Update Dog" : "Save Dog"}
      </Button>
    </form>
  );
}