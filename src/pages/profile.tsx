import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Heart, Briefcase, Star, Calendar, Settings, Plus, Edit, Trash2, MapPin, Trophy, Award, X, Building } from "lucide-react";
import { BadgeGrid, UserStatsDisplay } from "@/components/badge-display";
import ProviderCalendar from "@/components/provider-calendar";
import EmployeeManagement from "@/components/employee-management";
import ServiceAssignmentManagement from "@/components/service-assignment-management";

import SupplierProfileNew from "../SupplierProfileNew";
import SupplierProfileModern from "@/components/supplier-profile-modern";
import { BookingStatusCard } from "@/components/booking-status-card";
import SimpleOwnerProfile from "@/components/simple-owner-profile";
import EnhancedOwnerProfile from "@/components/enhanced-owner-profile";

// Schemas (only used for owners now, providers use business profile)
const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phoneNumber: z.string().regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, "Please enter a valid phone number").optional().or(z.literal("")),
  address: z.string().min(5, "Please enter a complete address").optional().or(z.literal("")),
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

  // Forms (only used for owners now)
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

  // Queries
  const { data: dogs = [] } = useQuery({
    queryKey: ["/api/dogs"],
    enabled: !!user && user.userType === 'owner',
  });

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: user?.userType === 'owner' ? ["/api/bookings/owner"] : ["/api/bookings/provider"],
    enabled: !!user,
  });

  // Mutations (only used for owners now)
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/user", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to update your profile",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error updating profile",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
  });

  const createDogMutation = useMutation({
    mutationFn: (data: DogFormData) => apiRequest("/api/dogs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Dog added successfully!" });
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
    mutationFn: ({ id, ...data }: { id: number } & DogFormData) => 
      apiRequest(`/api/dogs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Dog updated successfully!" });
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
    mutationFn: (dogId: number) => apiRequest(`/api/dogs/${dogId}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      toast({ title: "Dog removed successfully!" });
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

  // Event handlers
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
    dogForm.reset();
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

  const handleDeleteDog = (dogId: number) => {
    if (window.confirm("Are you sure you want to remove this dog?")) {
      deleteDogMutation.mutate(dogId);
    }
  };

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-doglife-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-doglife-primary mx-auto mb-4"></div>
          <p className="text-doglife-neutral">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || ""} />
            <AvatarFallback className="bg-doglife-primary text-white text-2xl">
              {user.firstName?.[0] || user.email?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-doglife-dark">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-doglife-neutral">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {user.userType}
              </Badge>
              {user.isSubscribed && (
                <Badge className="bg-doglife-accent text-white">Premium Member</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newUserType = user.userType === 'owner' ? 'provider' : 'owner';
                  updateProfileMutation.mutate({ userType: newUserType });
                }}
                className="ml-2"
              >
                Switch to {user.userType === 'owner' ? 'Provider' : 'Owner'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user.userType === 'provider' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            {user.userType === 'owner' && (
              <TabsTrigger value="dogs" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">My Dogs</span>
              </TabsTrigger>
            )}


            {user.userType === 'provider' && (
              <TabsTrigger value="custom-supplier" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Your Business</span>
              </TabsTrigger>
            )}
            {user.userType === 'provider' && (
              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
            )}

            {user.userType === 'provider' && (
              <TabsTrigger value="assignments" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Assignments</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
          </TabsList>
          


          {/* Profile Tab */}
          <TabsContent value="profile">
            {user.userType === 'owner' ? (
              <EnhancedOwnerProfile />
            ) : (
              <div className="space-y-6">
                {/* Account Overview for Providers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Account Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user.profileImageUrl || ""} />
                          <AvatarFallback className="bg-doglife-primary text-white text-lg">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
                          <p className="text-doglife-neutral">{user.email}</p>
                          <Badge variant="outline" className="mt-1">Service Provider</Badge>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> Your contact information and business details are managed in the 
                          <strong> "Your Business" </strong>tab. This keeps all your professional information in one place 
                          for better organization.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Email Address</h4>
                          <p className="text-sm text-doglife-neutral">{user.email}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Change Email
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Password</h4>
                          <p className="text-sm text-doglife-neutral">Last updated: Not specified</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Change Password
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-doglife-neutral">Manage booking alerts and updates</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Dogs Tab (Owner only) */}
          {user.userType === 'owner' && (
            <TabsContent value="dogs">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      My Dogs
                    </div>
                    <Button onClick={handleAddDog} className="bg-doglife-primary hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dog
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dogs && dogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dogs.map((dog: any) => (
                        <Card key={dog.id} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-doglife-dark">{dog.name}</h3>
                              <div className="flex space-x-2">
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
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <p className="text-sm text-doglife-neutral mb-2">
                              <strong>Breed:</strong> {dog.breed || "Not specified"}
                            </p>
                            <p className="text-sm text-doglife-neutral mb-2">
                              <strong>Age:</strong> {dog.age} years old
                            </p>
                            {dog.behavioralNotes && (
                              <p className="text-sm text-doglife-neutral">
                                <strong>Behavior:</strong> {dog.behavioralNotes}
                              </p>
                            )}
                            {dog.medicalHistory && (
                              <p className="text-sm text-doglife-neutral">
                                <strong>Medical:</strong> {dog.medicalHistory}
                              </p>
                            )}
                            {dog.specialCareNotes && (
                              <p className="text-sm text-doglife-neutral">
                                <strong>Special Care:</strong> {dog.specialCareNotes}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-doglife-neutral opacity-50" />
                      <p className="text-doglife-neutral mb-4">No dogs added yet</p>
                      <Button onClick={handleAddDog} className="bg-doglife-primary hover:bg-blue-700">
                        Add Your First Dog
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}



          {/* Provider Calendar Tab */}
          {user.userType === 'provider' && (
            <TabsContent value="calendar">
              <ProviderCalendar 
                bookings={bookings || []} 
                isLoading={isBookingsLoading} 
              />
            </TabsContent>
          )}

          {/* Team Management Tab */}


          {/* Service Assignment Management Tab */}
          {user.userType === 'provider' && (
            <TabsContent value="assignments">
              <ServiceAssignmentManagement providerId={user.id} />
            </TabsContent>
          )}

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {user.userType === 'owner' ? 'My Bookings' : 'Customer Bookings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings && bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <BookingStatusCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-doglife-neutral opacity-50" />
                    <p className="text-doglife-neutral">No bookings yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* Your Business Tab */}
          <TabsContent value="custom-supplier">
            <SupplierProfileModern />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Achievements & Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserStatsDisplay 
                  stats={{
                    totalBookings: bookings.length || 0,
                    completedBookings: bookings.filter((b: any) => b.status === 'completed').length || 0,
                    totalReviews: 0,
                    averageRating: "0.00",
                    badgePoints: 0,
                    level: 1,
                    streakDays: 0,
                    longestStreak: 0
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* Add Dog Dialog */}
      <Dialog open={showDogDialog} onOpenChange={setShowDogDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDog ? 'Edit Dog' : 'Add New Dog'}</DialogTitle>
          </DialogHeader>
          
          <Form {...dogForm}>
            <form onSubmit={dogForm.handleSubmit(onDogSubmit)} className="space-y-4">
              <FormField
                control={dogForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dog's Name</FormLabel>
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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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
                    <FormLabel>Behavior Notes (Optional)</FormLabel>
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
                    <FormLabel>Medical History (Optional)</FormLabel>
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
                    <FormLabel>Special Care Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowDogDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editingDog ? updateDogMutation.isPending : createDogMutation.isPending}
                  className="bg-doglife-primary hover:bg-blue-700"
                >
                  {editingDog 
                    ? (updateDogMutation.isPending ? "Updating..." : "Update Dog")
                    : (createDogMutation.isPending ? "Adding..." : "Add Dog")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}