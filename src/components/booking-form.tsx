import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Heart } from "lucide-react";

const bookingSchema = z.object({
  serviceId: z.number(),
  dogId: z.number().optional(), // Keep for single dog services
  dogIds: z.array(z.number()).optional(), // For multiple dog selection
  scheduledDate: z.string().min(1, "Please select a date and time"),

  departureDate: z.string().optional(),
  numberOfDogs: z.number().min(1, "At least 1 dog is required").default(1),
  kennelPreference: z.enum(["individual", "social", "no_preference"]).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Require at least one dog selection method
  if (!data.dogId && (!data.dogIds || data.dogIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one dog",
  path: ["dogIds"],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  service: {
    id: number;
    name: string;
    description: string;
    price: string;
    duration: number;
    provider: {
      id: number;
      businessName: string;
      rating: string;
      totalReviews: number;
      maxDogCapacity: number;
    };
  };
  onSuccess?: () => void;
}

export default function BookingForm({ service, onSuccess }: BookingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dogs } = useQuery({
    queryKey: ["/api/dogs"],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: service.id,
      dogId: undefined,
      dogIds: [],
      scheduledDate: "",

      departureDate: "",
      numberOfDogs: 1,
      kennelPreference: "no_preference",
      notes: "",
    },
  });

  // Check if this is a boarding or pet sitting service
  const isBoardingOrSitting = service.name.toLowerCase().includes("boarding") || 
                              service.name.toLowerCase().includes("sitting");

  // Calculate number of days and total cost for boarding services
  const calculateBookingDetails = () => {
    const formData = form.getValues();
    if (!isBoardingOrSitting || !formData.scheduledDate || !formData.departureDate) {
      return { numberOfDays: 0, totalCost: 0 };
    }

    const dropoffDate = new Date(formData.scheduledDate);
    const pickupDate = new Date(formData.departureDate);
    
    // Calculate the difference in time
    const timeDiff = pickupDate.getTime() - dropoffDate.getTime();
    // Convert to days and round up (even partial days count as full days)
    const numberOfDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    const nightlyRate = parseFloat(service.price);
    const numberOfDogs = formData.numberOfDogs || 1;
    const totalCost = nightlyRate * numberOfDays * numberOfDogs;
    
    return { numberOfDays, totalCost };
  };

  // Watch for changes to recalculate
  const scheduledDate = form.watch("scheduledDate");
  const departureDate = form.watch("departureDate");
  const numberOfDogs = form.watch("numberOfDogs");
  
  const { numberOfDays, totalCost } = calculateBookingDetails();

  const createBookingMutation = useMutation({
    mutationFn: (data: BookingFormData) => {
      // Calculate the correct total amount based on service type
      let calculatedTotal;
      if (isBoardingOrSitting) {
        const { totalCost } = calculateBookingDetails();
        calculatedTotal = totalCost;
      } else {
        calculatedTotal = parseFloat(service.price) * (data.numberOfDogs || 1);
      }

      const bookingData = {
        ...data,
        providerId: service.provider.id,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        departureDate: data.departureDate ? new Date(data.departureDate).toISOString() : undefined,
        totalAmount: calculatedTotal,
      };
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Booking confirmed!",
        description: "Your service has been booked successfully. You'll receive a confirmation email shortly.",
      });
      // Invalidate both owner and provider booking caches
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/owner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/provider"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  // Generate available time slots (simplified - in reality this would come from provider's calendar)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-doglife-dark">{service.name}</h3>
              <p className="text-sm text-doglife-neutral">{service.provider.businessName}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-doglife-neutral">
                <Clock className="h-4 w-4 mr-1" />
                <span>{service.duration} minutes</span>
              </div>
              <div className="flex items-center text-lg font-semibold text-doglife-dark">
                <span>R{service.price}</span>
              </div>
            </div>
            <p className="text-sm text-doglife-neutral">{service.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Select Dog(s) */}
              {isBoardingOrSitting ? (
                <FormField
                  control={form.control}
                  name="dogIds"
                  render={() => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        Select Dogs
                      </FormLabel>
                      <div className="space-y-3">
                        {dogs?.map((dog: any) => (
                          <FormField
                            key={dog.id}
                            control={form.control}
                            name="dogIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={dog.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(dog.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, dog.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value: number) => value !== dog.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {dog.name} ({dog.breed}, {dog.age}y)
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="dogId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        Select Dog
                      </FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose which dog needs this service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dogs?.map((dog: any) => (
                            <SelectItem key={dog.id} value={dog.id.toString()}>
                              {dog.name} ({dog.breed}, {dog.age}y)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Date Selection */}
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isBoardingOrSitting ? "Drop-off Date & Time" : "Preferred Date & Time"}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={`${minDate}T08:00`}
                        max={`${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T19:00`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Boarding/Pet Sitting specific fields */}
              {isBoardingOrSitting && (
                <>
                  {/* Departure Date and Time */}
                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Date and Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            min={`${minDate}T08:00`}
                            max={`${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T19:00`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Number of Dogs */}
                  <FormField
                    control={form.control}
                    name="numberOfDogs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Dogs</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue="1">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of dogs" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: Math.min(service.provider.maxDogCapacity || 5, 10) }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'Dog' : 'Dogs'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-sm text-doglife-neutral">
                          Provider can accommodate up to {service.provider.maxDogCapacity || 5} dogs
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Kennel Preference */}
                  <FormField
                    control={form.control}
                    name="kennelPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accommodation Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue="no_preference">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select accommodation preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">
                              Individual Kennel - My dog(s) need their own space
                            </SelectItem>
                            <SelectItem value="social">
                              Social Space - My dog(s) are friendly and can be with other dogs
                            </SelectItem>
                            <SelectItem value="no_preference">
                              No Preference - Provider can decide what's best
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-sm text-doglife-neutral">
                          This helps the provider prepare the best accommodation for your dog(s)
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Capacity Warning */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.211 0 2.176-1.072 1.923-2.247L13.923 4.753c-.227-1.051-1.619-1.051-1.846 0L5.139 16.753C4.886 17.928 5.851 19 7.062 19z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-yellow-800">Capacity-Based Booking</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          The provider will review your booking request and confirm availability based on their current capacity during your requested dates.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requirements or instructions for the service provider..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost Breakdown for Boarding Services */}
              {isBoardingOrSitting && numberOfDays > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Cost Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Nightly rate:</span>
                      <span className="font-medium">R{parseFloat(service.price).toFixed(2)} per dog</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Number of nights:</span>
                      <span className="font-medium">{numberOfDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Number of dogs:</span>
                      <span className="font-medium">{numberOfDogs}</span>
                    </div>
                    <div className="border-t border-green-200 dark:border-green-700 pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-base">
                        <span className="text-green-800 dark:text-green-200">Total Cost:</span>
                        <span className="text-green-800 dark:text-green-200">R{totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Terms */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-doglife-dark mb-2">Booking Terms</h4>
                <ul className="text-sm text-doglife-neutral space-y-1">
                  <li>• Free cancellation up to 48 hours before the scheduled service</li>
                  <li>• 50% cancellation fee applies for cancellations within 48 hours</li>
                  <li>• You'll receive confirmation and reminder notifications</li>
                  <li>• Payment will be processed upon service completion</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={createBookingMutation.isPending || !dogs || dogs.length === 0}
                className="w-full bg-doglife-primary hover:bg-blue-700"
              >
                {createBookingMutation.isPending ? "Booking..." : `Book Service - R${service.price}`}
              </Button>

              {(!dogs || dogs.length === 0) && (
                <p className="text-sm text-doglife-neutral text-center">
                  Please add a dog profile before booking services.
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
