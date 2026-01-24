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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Heart, Briefcase, Star, Calendar, Settings, Plus, Edit, Trash2, MapPin, Trophy, Award, X } from "lucide-react";
import { HybridAddressInput } from "@/components/hybrid-address-input";
import { BadgeGrid, UserStatsDisplay } from "@/components/badge-display";
import ProviderCalendar from "@/components/provider-calendar";
import EmployeeManagement from "@/components/employee-management";
import ServiceAssignmentManagement from "@/components/service-assignment-management";
import { BookingStatusCard } from "@/components/booking-status-card";

// Schemas
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

const providerSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  coveredSuburbs: z.array(z.string()).min(1, "Please select at least one suburb"),
  qualifications: z.string().optional(),
});

// Testing phase: Limited to Johannesburg and Sandton suburbs only
const SOUTH_AFRICAN_SUBURBS = [
  // Johannesburg Area
  "Bryanston", "Craighall", "Dainfern", "Emmarentia", "Ferndale", "Fourways", 
  "Greenside", "Hyde Park", "Linden", "Lone Hill", "Melrose", "Morningside", 
  "Northcliff", "Parkhurst", "Paulshof", "Randburg", "Rivonia", "Rosebank", 
  "Sunninghill", "Woodmead",
  
  // Sandton Area  
  "Sandton", "Sandton City", "Benmore", "Illovo", "Wendywood", "Bryanston East",
  "Morningside Manor", "Hurlingham", "Gallo Manor", "Douglasdale"
].sort();

// Service categories (these should match your database service categories)
const SERVICE_CATEGORIES = [
  "Dog Walking",
  "Pet Sitting", 
  "Dog Training",
  "Dog Grooming",
  "Veterinary Services",
  "Pet Transportation",
  "Dog Boarding",
  "Pet Photography",
  "Dog Daycare",
  "Behavioural Training",
  "Puppy Training",
  "Agility Training",
  "Pet First Aid",
  "Dog Washing",
  "Nail Trimming",
  "Teeth Cleaning",
  "Flea Treatment",
  "Emergency Pet Care"
].sort();

type ProfileFormData = z.infer<typeof profileSchema>;
type DogFormData = z.infer<typeof dogSchema>;
type ProviderFormData = z.infer<typeof providerSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [editingDog, setEditingDog] = useState<any>(null);
  const [showDogDialog, setShowDogDialog] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Queries
  const { data: dogs } = useQuery({
    queryKey: ["/api/dogs"],
    enabled: !!user && user.userType === 'owner',
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: user?.userType === 'owner' ? ["/api/bookings/owner"] : ["/api/bookings/provider"],
    enabled: !!user,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/user/badges"],
    enabled: !!user,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  // Forms
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
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

  const providerForm = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      businessName: user?.provider?.businessName || "",
      description: user?.provider?.description || "",
      coveredSuburbs: user?.provider?.coveredSuburbs || [],
      qualifications: user?.provider?.qualifications || "",
    },
  });

  // State for multi-select management
  const [selectedSuburbs, setSelectedSuburbs] = useState<string[]>(user?.provider?.coveredSuburbs || []);
  const [selectedServices, setSelectedServices] = useState<string[]>(user?.provider?.servicesOffered || []);
  const [editingProvider, setEditingProvider] = useState(false);

  // Update selected states when user data changes
  useEffect(() => {
    if (user?.provider) {
      setSelectedSuburbs(user.provider.coveredSuburbs || []);
      setSelectedServices(user.provider.servicesOffered || []);
    }
  }, [user?.provider]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest("PATCH", "/api/user/profile", data),
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createDogMutation = useMutation({
    mutationFn: (data: DogFormData) => apiRequest("POST", "/api/dogs", data),
    onSuccess: () => {
      toast({ title: "Dog profile created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/dogs"] });
      setShowDogDialog(false);
      dogForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create dog profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDogMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DogFormData> }) =>
      apiRequest("PATCH", `/api/dogs/${id}`, data),
    onSuccess: () => {
      toast({ title: "Dog profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/dogs"] });
      setShowDogDialog(false);
      setEditingDog(null);
      dogForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update dog profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: (data: ProviderFormData) => {
      const formattedData = {
        ...data,
        coveredSuburbs: selectedSuburbs,
        servicesOffered: selectedServices,
        qualifications: data.qualifications ? data.qualifications.split(',').map(q => q.trim()).filter(q => q.length > 0) : [],
      };
      return apiRequest("POST", "/api/providers", formattedData);
    },
    onSuccess: () => {
      toast({ title: "Provider profile created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create provider profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: (data: ProviderFormData) => {
      const formattedData = {
        ...data,
        coveredSuburbs: selectedSuburbs,
        servicesOffered: selectedServices,
        qualifications: data.qualifications ? data.qualifications.split(',').map(q => q.trim()).filter(q => q.length > 0) : [],
      };
      return apiRequest("PATCH", `/api/providers/${user?.provider?.id}`, formattedData);
    },
    onSuccess: () => {
      toast({ title: "Provider profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingProvider(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update provider profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onDogSubmit = (data: DogFormData) => {
    if (editingDog) {
      updateDogMutation.mutate({ id: editingDog.id, data });
    } else {
      createDogMutation.mutate(data);
    }
  };

  const onProviderSubmit = (data: ProviderFormData) => {
    if (editingProvider) {
      updateProviderMutation.mutate(data);
    } else {
      createProviderMutation.mutate(data);
    }
  };

  const handleEditProvider = () => {
    if (user?.provider) {
      // Initialize form with current values
      providerForm.reset({
        businessName: user.provider.businessName || "",
        description: user.provider.description || "",
        coveredSuburbs: user.provider.coveredSuburbs || [],
        qualifications: user.provider.qualifications || "",
      });
      setSelectedSuburbs(user.provider.coveredSuburbs || []);
      setEditingProvider(true);
    }
  };

  const handleEditDog = (dog: any) => {
    setEditingDog(dog);
    dogForm.reset({
      name: dog.name,
      breed: dog.breed || "",
      age: dog.age,
      behavioralNotes: dog.behavioralNotes || "",
      medicalHistory: dog.medicalHistory || "",
      specialCareNotes: dog.specialCareNotes || "",
    });
    setShowDogDialog(true);
  };

  const handleAddDog = () => {
    setEditingDog(null);
    dogForm.reset();
    setShowDogDialog(true);
  };

  // Initialize form values when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.phoneNumber, user?.address]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-doglife-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
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
          <TabsList className={`grid w-full ${user.userType === 'provider' ? 'grid-cols-6' : 'grid-cols-4'}`}>
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
              <TabsTrigger value="business" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
            )}
            {user.userType === 'provider' && (
              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
            )}
            {user.userType === 'provider' && (
              <TabsTrigger value="team" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Team</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="First name" />
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
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Last name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel" 
                              placeholder="e.g. +27 82 123 4567 or 082 123 4567"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <HybridAddressInput
                              value={field.value || ""}
                              onChange={(address, placeDetails) => {
                                field.onChange(address);
                                // Store additional place details if needed
                                console.log("Selected place:", placeDetails);
                              }}
                              placeholder="Start typing your South African address..."
                              disabled={updateProfileMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-doglife-primary hover:bg-blue-700"
                    >
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dogs Tab */}
          {user.userType === 'owner' && (
            <TabsContent value="dogs">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      My Dogs
                    </CardTitle>
                    <Button onClick={handleAddDog} className="bg-doglife-primary hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dog
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dogs && dogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dogs.map((dog: any) => (
                        <Card key={dog.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-doglife-dark">{dog.name}</h3>
                                <p className="text-sm text-doglife-neutral">{dog.breed}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{dog.age}y</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditDog(dog)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {dog.behavioralNotes && (
                              <p className="text-sm text-doglife-neutral mb-2">
                                <strong>Behavior:</strong> {dog.behavioralNotes}
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

          {/* Business Tab */}
          {user.userType === 'provider' && (
            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2" />
                      Business Profile
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-doglife-dark mb-2">
                        Complete Your Provider Profile
                      </h3>
                      <p className="text-doglife-neutral text-sm">
                        Fill out your complete service provider profile below. Your information will be automatically saved and processed.
                      </p>
                    </div>
                    
                    {/* Zoho Form Iframe */}
                    <div className="w-full">
                      <iframe 
                        aria-label='DogLife supplier' 
                        frameBorder="0" 
                        style={{height:'500px', width:'100%', border:'none', borderRadius:'8px'}} 
                        src='https://forms.zohopublic.com/hayleylambertigm1/form/DogLifesupplier/formperma/t7x_7R4kH3EsDERb01daywIGEuYOInt6A_bnVpQ1r3s'
                        title="DogLife Supplier Registration Form"
                      />
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">Profile Information</h4>
                          <div className="mt-1 text-sm text-blue-700">
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Your profile information will be automatically saved when you submit the form</li>
                              <li>You can update your profile at any time by resubmitting the form</li>
                              <li>All submissions are reviewed by our team for verification</li>
                              <li>You'll receive email confirmation once your profile is processed</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
          {user.userType === 'provider' && user.provider && (
            <TabsContent value="team">
              <EmployeeManagement providerId={user.provider.id} />
            </TabsContent>
          )}

          {/* Service Assignment Management Tab */}
          {user.userType === 'provider' && user.provider && (
            <TabsContent value="assignments">
              <ServiceAssignmentManagement providerId={user.provider.id} />
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
                  badges={user.badges || []}
                  totalBookings={user.totalBookings || 0}
                  totalReviews={user.totalReviews || 0}
                  averageRating={user.averageRating || 0}
                />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-doglife-secondary mr-1" />
                          <span>{user.provider.rating} ({user.provider.totalReviews} reviews)</span>
                        </div>
                        <Badge variant={user.provider.isVerified ? "default" : "secondary"}>
                          {user.provider.isVerified ? "Verified" : "Pending Verification"}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-doglife-dark mb-2">Service Areas:</p>
                        <div className="flex flex-wrap gap-2">
                          {user.provider.coveredSuburbs?.map((suburb: string, index: number) => (
                            <Badge key={index} variant="outline">{suburb}</Badge>
                          ))}
                        </div>
                      </div>
                      {user.provider.servicesOffered && user.provider.servicesOffered.length > 0 && (
                        <div>
                          <p className="font-medium text-doglife-dark mb-2">Services Offered:</p>
                          <div className="flex flex-wrap gap-2">
                            {user.provider.servicesOffered.map((service: string, index: number) => (
                              <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {user.provider.qualifications && user.provider.qualifications.length > 0 && (
                        <div>
                          <p className="font-medium text-doglife-dark mb-2">Qualifications & Certifications:</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(user.provider.qualifications) 
                              ? user.provider.qualifications 
                              : user.provider.qualifications.split(',')
                            ).map((qual: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                {qual.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Form {...providerForm}>
                      <form onSubmit={providerForm.handleSubmit(onProviderSubmit)} className="space-y-4">
                        <FormField
                          control={providerForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={providerForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={providerForm.control}
                          name="coveredSuburbs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Areas</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {SOUTH_AFRICAN_SUBURBS.map((suburb, index) => (
                                        <div key={`suburb-${index}-${suburb}`} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`suburb-${index}-${suburb}`}
                                            checked={selectedSuburbs.includes(suburb)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                const newSuburbs = [...selectedSuburbs, suburb];
                                                setSelectedSuburbs(newSuburbs);
                                                field.onChange(newSuburbs);
                                              } else {
                                                const newSuburbs = selectedSuburbs.filter(s => s !== suburb);
                                                setSelectedSuburbs(newSuburbs);
                                                field.onChange(newSuburbs);
                                              }
                                            }}
                                          />
                                          <label 
                                            htmlFor={`suburb-${index}-${suburb}`} 
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {suburb}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Selected suburbs display */}
                                  {selectedSuburbs.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Selected Areas ({selectedSuburbs.length}):</p>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedSuburbs.map((suburb) => (
                                          <Badge key={suburb} variant="secondary" className="text-xs">
                                            {suburb}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newSuburbs = selectedSuburbs.filter(s => s !== suburb);
                                                setSelectedSuburbs(newSuburbs);
                                                field.onChange(newSuburbs);
                                              }}
                                              className="ml-1 hover:bg-gray-300 rounded-full"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Services Selection */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium leading-none">Services Offered</label>
                          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {SERVICE_CATEGORIES.map((service, index) => (
                                <div key={`service-${index}-${service}`} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`service-${index}-${service}`}
                                    checked={selectedServices.includes(service)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedServices([...selectedServices, service]);
                                      } else {
                                        setSelectedServices(selectedServices.filter(s => s !== service));
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`service-${index}-${service}`} 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {service}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Selected services display */}
                          {selectedServices.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Selected Services ({selectedServices.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedServices.map((service) => (
                                  <Badge key={service} variant="default" className="text-xs">
                                    {service}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedServices(selectedServices.filter(s => s !== service));
                                      }}
                                      className="ml-1 hover:bg-gray-300 rounded-full"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <FormField
                          control={providerForm.control}
                          name="qualifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualifications & Certifications</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="e.g., Certified Dog Trainer (CCPDT), Pet First Aid Certified, 5+ years experience" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3">
                          {editingProvider && (
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => {
                                setEditingProvider(false);
                                providerForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button 
                            type="submit" 
                            disabled={editingProvider ? updateProviderMutation.isPending : createProviderMutation.isPending}
                            className="bg-doglife-primary hover:bg-blue-700"
                          >
                            {editingProvider 
                              ? (updateProviderMutation.isPending ? "Updating..." : "Update Business Profile")
                              : (createProviderMutation.isPending ? "Creating..." : "Create Business Profile")
                            }
                          </Button>
                        </div>
                      </form>
                    </Form>
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
          {user.userType === 'provider' && user.provider && (
            <TabsContent value="team">
              <EmployeeManagement providerId={user.provider.id} />
            </TabsContent>
          )}

          {/* Service Assignment Management Tab */}
          {user.userType === 'provider' && user.provider && (
            <TabsContent value="assignments">
              <ServiceAssignmentManagement providerId={user.provider.id} />
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

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="space-y-6">
              {/* User Statistics */}
              {userStats && (
                <UserStatsDisplay stats={userStats} />
              )}

              {/* Earned Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Badges ({userBadges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userBadges.length > 0 ? (
                    <BadgeGrid 
                      badges={userBadges.map(ub => ({ ...ub.badge, earnedAt: ub.earnedAt }))}
                      earnedBadges={userBadges.map(ub => ub.badge)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No badges earned yet</p>
                      <p className="text-sm text-gray-500 mt-2">Complete bookings and engage with the platform to earn your first badge!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Available Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgeGrid 
                    badges={allBadges.filter(badge => 
                      !badge.userType || badge.userType === user?.userType
                    )}
                    earnedBadges={userBadges.map(ub => ub.badge)}
                    emptyMessage="Loading badges..."
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dog Dialog */}
        <Dialog open={showDogDialog} onOpenChange={setShowDogDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDog ? "Edit Dog Profile" : "Add New Dog"}
              </DialogTitle>
            </DialogHeader>
            <Form {...dogForm}>
              <form onSubmit={dogForm.handleSubmit(onDogSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dogForm.control}
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
                </div>

                <FormField
                  control={dogForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (years)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                      <FormLabel>Behavior Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
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
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
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
                      <FormLabel>Special Care Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDogDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createDogMutation.isPending || updateDogMutation.isPending}
                    className="bg-doglife-primary hover:bg-blue-700"
                  >
                    {editingDog ? "Update" : "Add"} Dog
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}