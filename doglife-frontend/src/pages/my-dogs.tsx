import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Plus, Edit, Trash2, Calendar, Scale, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
// Import types from schema
type Dog = {
  id: string;
  name: string;
  breed?: string;
  gender?: string;
  size: string;
  dateOfBirth?: string;
  medicalNotes?: string;
  profileImageUrl?: string;
  ownerId: string;
};

// Enhanced Add/Edit Dog form schema with comprehensive validation
const dogSchema = z.object({
  name: z.string()
    .min(1, "Dog name is required")
    .max(50, "Dog name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Dog name can only contain letters, spaces, hyphens, and apostrophes"),
  breed: z.string()
    .max(50, "Breed name must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  gender: z.string()
    .optional()
    .or(z.literal("")),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "XL"]).optional(),
  birthDate: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      const now = new Date();
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(now.getFullYear() - 100);
      return parsed <= now && parsed >= hundredYearsAgo;
    }, "Birth date must be in the past and within the last 100 years")
    .or(z.literal("")),
  notes: z.string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal(""))
});

type DogForm = z.infer<typeof dogSchema>;

export default function MyDogsPage() {
  const [deletingDogId, setDeletingDogId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Add/Edit dog form
  const form = useForm<DogForm>({
    resolver: zodResolver(dogSchema),
    defaultValues: {
      name: "",
      breed: "",
      gender: "",
      size: "MEDIUM",
      birthDate: "",
      notes: "",
    },
  });

  // Define dog type
  type Dog = { id: string; name: string; breed?: string; gender?: string; size?: string; birthDate?: string; dateOfBirth?: string; notes?: string; medicalNotes?: string; profileImageUrl?: string };

  // Fetch user's dogs using the new API endpoint
  const { data: dogsResponse, isLoading, error } = useQuery<{ ok: boolean; dogs: Dog[] }>({
    queryKey: ['/api/dogs/mine'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch('/api/dogs/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dogs');
      return response.json();
    }
  });
  
  // API returns { ok: true, dogs: Dog[] }
  const dogs = dogsResponse?.dogs || [];

  // Delete dog mutation
  // Add dog mutation
  const addDogMutation = useMutation({
    mutationFn: async (data: DogForm) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');
      
      // Map form fields to API fields and clean up empty strings
      const apiPayload = {
        name: data.name.trim(),
        breed: data.breed?.trim() || undefined,
        gender: data.gender?.trim() || undefined,
        size: data.size || undefined,
        birthDate: data.birthDate?.trim() || undefined,
        notes: data.notes?.trim() || undefined
      };
      
      const response = await fetch('/api/dogs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add dog. Please check your information and try again.');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dog added successfully!",
        description: "Your furry friend has been added to your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dogs/mine'] });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add dog",
        description: error?.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  // Edit dog mutation
  const editDogMutation = useMutation({
    mutationFn: async ({ dogId, data }: { dogId: string, data: DogForm }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');
      
      // Map form fields to API fields and clean up empty strings
      const apiPayload = {
        name: data.name.trim(),
        breed: data.breed?.trim() || undefined,
        gender: data.gender?.trim() || undefined,
        size: data.size || undefined,
        birthDate: data.birthDate?.trim() || undefined,
        notes: data.notes?.trim() || undefined
      };
      
      const response = await fetch(`/api/dogs/${dogId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update dog. Please check your information and try again.');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dog updated successfully!",
        description: "Your dog's information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dogs/mine'] });
      setEditingDog(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update dog",
        description: error?.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  // Delete dog mutation
  const deleteDogMutation = useMutation({
    mutationFn: async (dogId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');
      
      const response = await fetch(`/api/dogs/${dogId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete dog');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dog removed",
        description: "Your dog has been successfully removed from your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dogs/mine'] });
      setDeletingDogId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove dog",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      setDeletingDogId(null);
    },
  });

  const handleDeleteDog = (dogId: string) => {
    setDeletingDogId(dogId);
  };

  const confirmDeleteDog = () => {
    if (deletingDogId) {
      deleteDogMutation.mutate(deletingDogId);
    }
  };

  const onSubmitDogForm = (data: DogForm) => {
    if (editingDog) {
      editDogMutation.mutate({ dogId: editingDog.id, data });
    } else {
      addDogMutation.mutate(data);
    }
  };

  const handleEditDog = (dog: Dog) => {
    setEditingDog(dog);
    setShowAddForm(true);
    // Populate form with dog's current data
    form.reset({
      name: dog.name || "",
      breed: dog.breed || "",
      gender: dog.gender || "",
      size: dog.size as "SMALL" | "MEDIUM" | "LARGE" | "XL" | undefined,
      birthDate: dog.dateOfBirth ? dog.dateOfBirth.split('T')[0] : "", // Convert ISO date to YYYY-MM-DD
      notes: dog.medicalNotes || "",
    });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingDog(null);
    form.reset();
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'SMALL': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LARGE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'Male' ? '♂' : '♀';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load your dogs. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dogs</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your furry family members
            </p>
          </div>
          <Button 
            onClick={() => {
              if (showAddForm) {
                handleCancelForm();
              } else {
                setShowAddForm(true);
              }
            }}
            className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
            data-testid="button-add-dog"
          >
            <Plus className="mr-2 h-4 w-4" />
            {showAddForm ? 'Cancel' : 'Add New Dog'}
          </Button>
        </div>

        {/* Add Dog Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingDog ? 'Edit Dog' : 'Add New Dog'}</CardTitle>
              <CardDescription>
                {editingDog ? 'Update your dog\'s information' : 'Fill in your dog\'s basic information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitDogForm)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-add-dog-name" />
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
                            <Input {...field} data-testid="input-add-dog-breed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-add-dog-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-add-dog-size">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SMALL">Small</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="LARGE">Large</SelectItem>
                              <SelectItem value="XL">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-add-dog-birthdate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any special notes about your dog..."
                            data-testid="textarea-add-dog-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelForm}
                      data-testid="button-cancel-dog-form"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addDogMutation.isPending || editDogMutation.isPending}
                      className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
                      data-testid="button-submit-dog-form"
                    >
                      {editingDog 
                        ? (editDogMutation.isPending ? 'Updating...' : 'Update Dog')
                        : (addDogMutation.isPending ? 'Adding...' : 'Add Dog')
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Dogs Grid */}
        {dogs && dogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dogs.map((dog) => (
              <Card key={dog.id} className="w-full hover:shadow-lg transition-shadow" data-testid={`card-dog-${dog.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={dog.profileImageUrl || undefined} alt={dog.name} />
                        <AvatarFallback className="bg-[hsl(24,100%,95%)] text-[hsl(24,100%,40%)]">
                          {dog.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white" data-testid={`text-dog-name-${dog.id}`}>
                          {dog.name} {dog.gender ? getGenderIcon(dog.gender) : ''}
                        </CardTitle>
                        <CardDescription data-testid={`text-dog-breed-${dog.id}`}>
                          {dog.breed || "Mixed breed"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDog(dog)}
                        data-testid={`button-edit-dog-${dog.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDog(dog.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-dog-${dog.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getSizeColor(dog.size || 'MEDIUM')} data-testid={`badge-size-${dog.id}`}>
                      <Scale className="mr-1 h-3 w-3" />
                      {dog.size || 'Medium'}
                    </Badge>
                    {dog.dateOfBirth && (
                      <Badge variant="secondary" data-testid={`badge-age-${dog.id}`}>
                        <Calendar className="mr-1 h-3 w-3" />
                        Born {format(new Date(dog.dateOfBirth), 'MMM yyyy')}
                      </Badge>
                    )}
                  </div>

                  {/* Notes */}
                  {dog.medicalNotes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start" data-testid={`text-notes-${dog.id}`}>
                        <Info className="mr-1 h-3 w-3 mt-0.5 flex-shrink-0" />
                        {dog.medicalNotes.length > 100 ? `${dog.medicalNotes.slice(0, 100)}...` : dog.medicalNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No dogs yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add your first furry family member to get started!
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
              data-testid="button-add-first-dog"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Dog
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDogId} onOpenChange={() => setDeletingDogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Dog</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this dog from your profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDogId(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteDog}
              disabled={deleteDogMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteDogMutation.isPending ? "Removing..." : "Remove Dog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}