import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, MapPin, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const enquirySchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  suburb: z.string().min(2, "Please enter your suburb"),
  userType: z.enum(["dog_owner", "service_provider"]),
  serviceType: z.string().optional(),
}).refine((data) => {
  if (data.userType === "service_provider" && !data.serviceType) {
    return false;
  }
  return true;
}, {
  message: "Please specify your service type",
  path: ["serviceType"],
});

type ProspectEnquiryForm = z.infer<typeof enquirySchema>;

const serviceTypes = [
  "Dog Grooming",
  "Dog Boarding",
  "Pet Sitting",
  "Dog Walking",
  "Dog Training",
  "Doggy Daycare",
  "Vet Services",
  "Pet Transport",
];

export default function ProspectEnquiry() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ProspectEnquiryForm>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      suburb: "",
      userType: undefined,
      serviceType: "",
    },
  });

  const enquiryMutation = useMutation({
    mutationFn: (data: ProspectEnquiryForm) => 
      apiRequest("/api/prospect-enquiries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Thank You!",
        description: "We've received your enquiry and will notify you when DogLife expands to your area.",
      });
    },
    onError: (error) => {
      console.error("Enquiry submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your enquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProspectEnquiryForm) => {
    enquiryMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <>
        
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-teal-600">Thank You!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                We've received your enquiry and will email you as soon as DogLife 
                expands to your area. You'll be among the first to know!
              </p>
              <Link to="/" className="inline-block w-full text-center bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90">
                Back to Home
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join Our Waiting List
            </h1>
            <p className="text-gray-600">
              We're expanding across South Africa! Tell us about your interest in DogLife 
              and we'll notify you when we launch in your area.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-teal-800 text-xl">
                Coming Soon to Your Area
              </CardTitle>
              <p className="text-teal-700 text-sm mt-2">
                Be the first to know when DogLife expands to your location
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          We'll use this to notify you when DogLife launches in your area
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="suburb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Suburb</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your suburb name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dog_owner">Dog Owner</SelectItem>
                            <SelectItem value="service_provider">Service Provider</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("userType") === "service_provider" && (
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes.map((service) => (
                                <SelectItem key={service} value={service}>
                                  {service}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            What type of dog service do you want to provide?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="bg-gradient-to-r from-teal-100 to-emerald-100 p-6 rounded-xl border border-teal-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-teal-800 mb-2 text-lg">
                          Currently Serving Gauteng
                        </h4>
                        <p className="text-sm text-teal-700 leading-relaxed">
                          We're active in Johannesburg, Sandton, Fourways, Rosebank, 
                          Bryanston, Hyde Park, Randburg, and 20+ other suburbs in the area.
                        </p>
                        <p className="text-sm text-emerald-700 font-semibold mt-3 px-3 py-1 bg-emerald-200 rounded-full inline-block">
                          🚀 Gauteng first. South Africa next.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg transform hover:scale-105 transition-all duration-200"
                    disabled={enquiryMutation.isPending}
                  >
                    {enquiryMutation.isPending ? "Submitting..." : "Join Waiting List"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}