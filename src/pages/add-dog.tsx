import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api"; // ✅ IMPORTANT CHANGE
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";

/* ================================
   SCHEMA (FIXED TO MATCH BACKEND)
================================ */

const addDogSchema = z.object({
  name: z.string().min(1),
  breed: z.string().optional(),
  gender: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "XL"]).optional(),
  dateOfBirth: z.string().optional(), // ✅ FIXED NAME
  medicalNotes: z.string().optional(), // ✅ FIXED NAME
  photoUrl: z.string().optional()
});

type AddDogFormData = z.infer<typeof addDogSchema>;

export default function AddDogPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<AddDogFormData>({
    resolver: zodResolver(addDogSchema),
    defaultValues: {
      name: "",
      breed: "",
      gender: "",
      size: "MEDIUM",
      dateOfBirth: "",
      medicalNotes: "",
      photoUrl: ""
    },
  });

  /* ================================
     MUTATION (FIXED)
  ================================ */

  const addDogMutation = useMutation({
    mutationFn: async (data: AddDogFormData) => {
      const res = await api.post("/api/owner/dogs", {
        ...data,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString()
          : null,
      });

      return res.data;
    },

    onSuccess: () => {
      toast({
        title: "Dog added successfully!",
      });

      queryClient.invalidateQueries({ queryKey: ["owner-dogs"] });

      navigate("/my-dogs");
    },

    onError: (error: any) => {
      console.error(error);

      toast({
        title: "Failed to add dog",
        description: error?.response?.data?.error || "Try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddDogFormData) => {
    addDogMutation.mutate(data);
  };

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Dog</CardTitle>
          <CardDescription>Tell us about your dog</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SMALL">Small</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LARGE">Large</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={addDogMutation.isPending}>
                {addDogMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Heart className="mr-2" />
                )}
                Add Dog
              </Button>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}