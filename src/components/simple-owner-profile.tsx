import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Heart } from "lucide-react";

// Simple owner profile schema
const ownerProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  street: z.string().optional(),
  suburb: z.string().optional(),
  emergencyName: z.string().min(1, "Emergency contact name is required"),
  emergencyPhone: z.string().min(1, "Emergency contact phone is required"),
});

type OwnerProfileFormData = z.infer<typeof ownerProfileSchema>;

export default function SimpleOwnerProfile() {
  const queryClient = useQueryClient();

  const form = useForm<OwnerProfileFormData>({
    resolver: zodResolver(ownerProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      street: "",
      suburb: "",
      emergencyName: "",
      emergencyPhone: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: OwnerProfileFormData) => {
      return await apiRequest("/api/owner/profile", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          pets: [{
            name: data.firstName ? `${data.firstName}'s Dog` : "My Dog",
            breed: "Mixed",
            gender: "Unknown"
          }]
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OwnerProfileFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-doglife-dark">Complete Your Owner Profile</h2>
        <p className="text-doglife-neutral">Fill out your details to book dog services</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  className={form.formState.errors.firstName ? "border-red-500" : ""}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  className={form.formState.errors.lastName ? "border-red-500" : ""}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Mobile *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...form.register("phoneNumber")}
                  className={form.formState.errors.phoneNumber ? "border-red-500" : ""}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" {...form.register("street")} />
            </div>

            <div>
              <Label htmlFor="suburb">Suburb</Label>
              <Input id="suburb" {...form.register("suburb")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyName"
                  {...form.register("emergencyName")}
                  className={form.formState.errors.emergencyName ? "border-red-500" : ""}
                />
                {form.formState.errors.emergencyName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.emergencyName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  {...form.register("emergencyPhone")}
                  className={form.formState.errors.emergencyPhone ? "border-red-500" : ""}
                />
                {form.formState.errors.emergencyPhone && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.emergencyPhone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saveMutation.isPending}
            className="bg-doglife-primary hover:bg-doglife-primary/90"
          >
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}