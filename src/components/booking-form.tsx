import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Clock, Dog } from "lucide-react";

const bookingFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  dogId: z.string().min(1, "Please select a dog"),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTime: z.string().min(1, "Please select a time"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface DogOption {
  id: string;
  name: string;
}

interface ServiceOption {
  id: string;
  name: string;
  price?: number;
  duration?: number;
}

interface BookingFormProps {
  providerId?: string;
  serviceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BookingForm({
  providerId,
  serviceId: preselectedServiceId,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: preselectedServiceId || "",
      dogId: "",
      scheduledDate: "",
      scheduledTime: "",
      notes: "",
    },
  });

  const { data: dogs = [] } = useQuery<DogOption[]>({
    queryKey: ["/api/dogs/mine"],
    enabled: !!user,
  });

  const { data: services = [] } = useQuery<ServiceOption[]>({
    queryKey: ["/api/services", providerId],
    enabled: !!providerId,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          scheduledDate: `${data.scheduledDate}T${data.scheduledTime}:00`,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create booking");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your booking request has been submitted successfully.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    try {
      await createBookingMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === form.watch("serviceId"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-[hsl(24,100%,50%)]" />
          <span>Book a Service</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!preselectedServiceId && services.length > 0 && (
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} {service.price && `- R${service.price}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dogId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Dog className="h-4 w-4" />
                    <span>Select Your Dog</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a dog" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dogs.map((dog) => (
                        <SelectItem key={dog.id} value={dog.id}>
                          {dog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Date</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Time</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedService && (
              <div className="rounded-lg bg-[hsl(24,100%,97%)] p-4 border border-[hsl(24,100%,90%)]">
                <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Service:</span> {selectedService.name}
                  </p>
                  {selectedService.price && (
                    <p>
                      <span className="text-gray-500">Price:</span> R{selectedService.price}
                    </p>
                  )}
                  {selectedService.duration && (
                    <p>
                      <span className="text-gray-500">Duration:</span> {selectedService.duration} min
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
