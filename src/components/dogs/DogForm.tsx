import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";

export default function DogForm({ dog, onClose }: any) {
  const [imageUrl, setImageUrl] = useState("");

  const form = useForm({
    defaultValues: {
      name: dog?.name || "",
      breed: dog?.breed || "",
    },
  });

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

    // 🔥 OPTIMISTIC UPDATE (instant UI)
    onSuccess: (result, variables) => {
      queryClient.setQueryData(["owner-dogs"], (old: any) => {
        if (!old) return old;

        // ✏️ EDIT EXISTING DOG
        if (dog?.id) {
          return {
            ...old,
            dogs: old.dogs.map((d: any) =>
              d.id === dog.id
                ? {
                    ...d,
                    ...variables,
                    profileImageUrl: imageUrl || d.profileImageUrl,
                  }
                : d
            ),
          };
        }

        // ➕ ADD NEW DOG
        return {
          ...old,
          dogs: [
            {
              ...result.dog,
              profileImageUrl: imageUrl,
            },
            ...old.dogs,
          ],
        };
      });

      onClose();
    },

    // 🔄 Ensure backend + UI stay aligned
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });
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
      className="mb-6 space-y-3"
    >
      <ImageUpload onUpload={setImageUrl} />

      <Input placeholder="Dog name" {...form.register("name")} />

      <Input placeholder="Breed" {...form.register("breed")} />

      <Button type="submit">
        {dog ? "Update Dog" : "Save Dog"}
      </Button>
    </form>
  );
}