import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, ArrowLeft, CalendarIcon, Heart, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Define dog schema for form validation - matching our API
const addDogSchema = z.object({
  name: z.string().min(1, "Dog name is required"),
  breed: z.string().optional(),
  gender: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "XL"]).optional(),
  birthDate: z.string().optional(), // Will be converted to Date
  notes: z.string().optional(),
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
      birthDate: "",
      notes: "",
    },
  });

  // Add dog mutation using our new API
  const addDogMutation = useMutation({
    mutationFn: async (data: AddDogFormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch('/api/dogs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add dog');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dog added successfully!",
        description: "Your furry friend has been added to your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dogs/mine'] });
      navigate("/my-dogs");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add dog",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddDogFormData) => {
    setIsSubmitting(true);
    addDogMutation.mutate(data);
    setIsSubmitting(false);
  };

  const dogBreeds = [
    "Golden Retriever", "Labrador Retriever", "German Shepherd", "Bulldog",
    "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier", "Dachshund",
    "Siberian Husky", "Boxer", "Border Collie", "Australian Shepherd",
    "Jack Russell Terrier", "Boston Terrier", "Cocker Spaniel", "Chihuahua",
    "Shih Tzu", "Maltese", "Pomeranian", "Mixed Breed", "Other"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-dogs')}
            className="mb-4"
            data-testid="button-back-to-dogs"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Dogs
          </Button>
          
          <div className="text-center">
            <Heart className="h-12 w-12 text-[hsl(24,100%,50%)] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Add New Dog
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Tell us about your furry family member
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dog Information</CardTitle>
            <CardDescription>
              Fill in the details about your dog. This information helps service providers better understand your pet's needs.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid gap-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dog's Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Buddy, Luna, Max"
                            {...field}
                            data-testid="input-dog-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Breed */}
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-dog-breed">
                              <SelectValue placeholder="Select a breed" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dogBreeds.map((breed) => (
                              <SelectItem key={breed} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the breed that best matches your dog
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gender and Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-dog-gender">
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-dog-size">
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
                  </div>

                  {/* Birth Date */}
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-birth-date"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When was your dog born? This helps service providers understand your dog's age and needs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your dog's personality, special needs, favorite activities, behavioral notes, etc."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-dog-notes"
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Share anything that would help service providers better care for your dog
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/my-dogs")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || addDogMutation.isPending}
                    className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
                    data-testid="button-submit"
                  >
                    {isSubmitting || addDogMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Dog...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Add Dog
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}