import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Mail, Phone, MapPin } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  mobilePhone: z
    .string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  suburb: z.string().min(2, "Please enter your suburb").optional().or(z.literal("")),
  address: z.string().min(5, "Please enter a complete address").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobilePhone: "",
      suburb: "",
      address: "",
    },
  });

  const { data: ownerProfile, isLoading: ownerProfileLoading } = useQuery({
    queryKey: ["owner-profile"],
    queryFn: async () => {
      const res = await api.get("/api/owner/profile");
      return res.data?.profile || null;
    },
    enabled: !!user,
    retry: false,
  });

  const profileUser = ownerProfile?.user || user;

  useEffect(() => {
    if (!profileUser) return;

    form.reset({
      firstName: profileUser.firstName || "",
      lastName: profileUser.lastName || "",
      mobilePhone: profileUser.mobilePhone || "",
      suburb: ownerProfile?.suburb || "",
      address: ownerProfile?.address || "",
    });
  }, [profileUser, ownerProfile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await api.post("/api/owner/profile", {
        firstName: data.firstName,
        lastName: data.lastName,
        mobilePhone: data.mobilePhone || null,
        suburb: data.suburb || null,
        address: data.address || null,
      });

      return res.data;
    },
    onSuccess: async () => {
      toast({ title: "Profile updated successfully" });

      await queryClient.invalidateQueries({ queryKey: ["owner-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error?.response?.data?.error || error?.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading || ownerProfileLoading || !user) {
    return (
      <div className="min-h-screen bg-doglife-gray-50 flex items-center justify-center">
        <p className="text-doglife-neutral">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={(user as any).profileImageUrl || ""} alt={profileUser?.firstName || ""} />
            <AvatarFallback className="bg-doglife-primary text-white text-2xl">
              {profileUser?.firstName?.[0] || profileUser?.email?.[0] || "?"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-3xl font-bold text-doglife-dark">
              {profileUser?.firstName} {profileUser?.lastName}
            </h1>
            <p className="text-doglife-neutral">{profileUser?.email}</p>
            <Badge variant="outline">Dog Owner</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={profileUser?.email || ""} disabled />
                </div>

                <FormField
                  control={form.control}
                  name="suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suburb</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter your suburb for faster service search"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={4}
                          placeholder="Enter your address for home-based services"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
                  Your suburb helps us show nearby providers faster. Your address is used for services that happen at your home, such as walking, home training, mobile grooming, or mobile vet bookings.
                </div>

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Mail className="h-5 w-5 mt-0.5 text-doglife-neutral" />
              <div>
                <p className="font-medium">Email address</p>
                <p className="text-sm text-doglife-neutral">{profileUser?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Phone className="h-5 w-5 mt-0.5 text-doglife-neutral" />
              <div>
                <p className="font-medium">Phone number</p>
                <p className="text-sm text-doglife-neutral">
                  {form.watch("mobilePhone") || "Not added yet"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <MapPin className="h-5 w-5 mt-0.5 text-doglife-neutral" />
              <div>
                <p className="font-medium">Suburb</p>
                <p className="text-sm text-doglife-neutral">
                  {form.watch("suburb") || "Not added yet"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <MapPin className="h-5 w-5 mt-0.5 text-doglife-neutral" />
              <div>
                <p className="font-medium">Home address</p>
                <p className="text-sm text-doglife-neutral whitespace-pre-line">
                  {form.watch("address") || "Not added yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}