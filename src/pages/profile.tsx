import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Heart,
  Settings,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phoneNumber: z
    .string()
    .regex(
      /^[\+]?[0-9\s\-\(\)]{10,}$/,
      "Please enter a valid phone number"
    )
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(5, "Please enter a complete address")
    .optional()
    .or(z.literal("")),
});

const dogSchema = z.object({
  name: z.string().min(2, "Dog name must be at least 2 characters"),
  breed: z.string().optional(),
  age: z.number().min(0).max(30),
  behavioralNotes: z.string().optional(),
  medicalHistory: z.string().optional(),
  specialCareNotes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type DogFormData = z.infer<typeof dogSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("profile");
  const [editingDog, setEditingDog] = useState<any>(null);
  const [showDogDialog, setShowDogDialog] = useState(false);

  const isOwner = user?.userType === "owner";

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
    },
  });

  const dogForm = useForm<DogFormData>({
    resolver: zodResolver(dogSchema),
    defaultValues: {
      name: "",
      breed: "",
      age: 0,
      behavioralNotes: "",
      medicalHistory: "",
      specialCareNotes: "",
    },
  });

  const { data: dogs = [] } = useQuery<
    {
      id: string;
      name: string;
      breed?: string;
      age?: number;
      behavioralNotes?: string;
      medicalHistory?: string;
      specialCareNotes?: string;
    }[]
  >({
    queryKey: ["/api/dogs"],
    enabled: !!user && isOwner,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      apiRequest("/api/user", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const createDogMutation = useMutation({
    mutationFn: (data: DogFormData) =>
      apiRequest("/api/dogs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Dog added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/dogs"] });
      setShowDogDialog(false);
      dogForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding dog",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const updateDogMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & DogFormData) =>
      apiRequest(`/api/dogs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Dog updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/dogs"] });
      setShowDogDialog(false);
      setEditingDog(null);
      dogForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating dog",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteDogMutation = useMutation({
    mutationFn: (dogId: string) =>
      apiRequest(`/api/dogs/${dogId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "Dog removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/dogs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing dog",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onDogSubmit = (data: DogFormData) => {
    if (editingDog) {
      updateDogMutation.mutate({ id: editingDog.id, ...data });
    } else {
      createDogMutation.mutate(data);
    }
  };

  const handleAddDog = () => {
    setEditingDog(null);
    dogForm.reset({
      name: "",
      breed: "",
      age: 0,
      behavioralNotes: "",
      medicalHistory: "",
      specialCareNotes: "",
    });
    setShowDogDialog(true);
  };

  const handleEditDog = (dog: any) => {
    setEditingDog(dog);
    dogForm.reset({
      name: dog.name || "",
      breed: dog.breed || "",
      age: dog.age || 0,
      behavioralNotes: dog.behavioralNotes || "",
      medicalHistory: dog.medicalHistory || "",
      specialCareNotes: dog.specialCareNotes || "",
    });
    setShowDogDialog(true);
  };

  const handleDeleteDog = (dogId: string) => {
    if (window.confirm("Are you sure you want to remove this dog?")) {
      deleteDogMutation.mutate(dogId);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-doglife-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-doglife-primary mx-auto mb-4" />
          <p className="text-doglife-neutral">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={user.profileImageUrl || ""}
              alt={user.firstName || ""}
            />
            <AvatarFallback className="bg-doglife-primary text-white text-2xl">
              {user.firstName?.[0] || user.email?.[0] || "?"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-3xl font-bold text-doglife-dark">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-doglife-neutral">{user.email}</p>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {isOwner ? "Dog Owner" : "Service Provider"}
              </Badge>
              {user.isSubscribed ? (
                <Badge className="bg-doglife-accent text-white">
                  Premium Member
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {isOwner ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="dogs" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>My Dogs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form
                        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone number</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input value={user.email || ""} disabled />
                          </div>
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={3}
                                  placeholder="Enter your home address for home-based services like walking, training or mobile vet visits"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
                          Save your address here so suppliers can receive it
                          after a relevant booking is confirmed.
                        </div>

                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="bg-doglife-primary hover:bg-blue-700"
                        >
                          {updateProfileMutation.isPending
                            ? "Saving..."
                            : "Save Profile"}
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
                        <p className="text-sm text-doglife-neutral">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <Phone className="h-5 w-5 mt-0.5 text-doglife-neutral" />
                      <div>
                        <p className="font-medium">Phone number</p>
                        <p className="text-sm text-doglife-neutral">
                          {profileForm.watch("phoneNumber") || "Not added yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <MapPin className="h-5 w-5 mt-0.5 text-doglife-neutral" />
                      <div>
                        <p className="font-medium">Service address</p>
                        <p className="text-sm text-doglife-neutral">
                          {profileForm.watch("address") || "Not added yet"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="dogs">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      My Dogs
                    </div>
                    <Button
                      onClick={handleAddDog}
                      className="bg-doglife-primary hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dog
                    </Button>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {dogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dogs.map((dog: any) => (
                        <Card key={dog.id} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-doglife-dark">
                                {dog.name}
                              </h3>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditDog(dog)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDog(dog.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-2 space-y-2 text-sm text-doglife-neutral">
                            <p>
                              <strong>Breed:</strong>{" "}
                              {dog.breed || "Not specified"}
                            </p>
                            <p>
                              <strong>Age:</strong>{" "}
                              {dog.age ?? "Not specified"}
                            </p>
                            {dog.behavioralNotes ? (
                              <p>
                                <strong>Behaviour:</strong>{" "}
                                {dog.behavioralNotes}
                              </p>
                            ) : null}
                            {dog.medicalHistory ? (
                              <p>
                                <strong>Medical:</strong> {dog.medicalHistory}
                              </p>
                            ) : null}
                            {dog.specialCareNotes ? (
                              <p>
                                <strong>Special care:</strong>{" "}
                                {dog.specialCareNotes}
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-doglife-neutral opacity-50" />
                      <p className="text-doglife-neutral mb-4">
                        No dogs added yet
                      </p>
                      <Button
                        onClick={handleAddDog}
                        className="bg-doglife-primary hover:bg-blue-700"
                      >
                        Add Your First Dog
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-doglife-neutral">{user.email}</p>
                </div>

                <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
                  Your supplier business details are managed from the supplier
                  dashboard tabs, not from this page.
                </div>
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
                    <p className="text-sm text-doglife-neutral">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Phone className="h-5 w-5 mt-0.5 text-doglife-neutral" />
                  <div>
                    <p className="font-medium">Phone number</p>
                    <p className="text-sm text-doglife-neutral">
                      {user.phoneNumber || "Not added yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showDogDialog} onOpenChange={setShowDogDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDog ? "Edit Dog" : "Add New Dog"}
            </DialogTitle>
          </DialogHeader>

          <Form {...dogForm}>
            <form
              onSubmit={dogForm.handleSubmit(onDogSubmit)}
              className="space-y-4"
            >
              <FormField
                control={dogForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dog's name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dogForm.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dogForm.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="30"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : 0
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dogForm.control}
                name="behavioralNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behaviour notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dogForm.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical history</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dogForm.control}
                name="specialCareNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special care notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDogDialog(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    editingDog
                      ? updateDogMutation.isPending
                      : createDogMutation.isPending
                  }
                  className="bg-doglife-primary hover:bg-blue-700"
                >
                  {editingDog
                    ? updateDogMutation.isPending
                      ? "Updating..."
                      : "Update Dog"
                    : createDogMutation.isPending
                    ? "Adding..."
                    : "Add Dog"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}