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
      return await apiRequest(`/api/owner/dogs/${dog.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } else {
      return await apiRequest("/api/owner/dogs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
  },

  onSuccess: async () => {
    // 🔥 THIS IS THE FIX
    await queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });

    onClose();
  },
});

  return (
   <form
  onSubmit={form.handleSubmit((data) =>
    mutation.mutate({
      ...data,
      profileImageUrl: imageUrl
    })
  )}
  className="mb-6 space-y-3"
>

  <ImageUpload onUpload={setImageUrl} />

  <Input placeholder="Dog name" {...form.register("name")} />

  <Input placeholder="Breed" {...form.register("breed")} />

  <Button type="submit">Save Dog</Button>

</form> 
  );
}