import { useState, useEffect } from "react";
import { useForm, useFieldArray, FieldValues, Control } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { X, Plus, User, Building, Heart, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define enums from existing patterns
const SERVICE_TYPES = [
  { value: "WALKING", label: "Dog Walking", icon: "🚶" },
  { value: "TRAINING", label: "Training", icon: "🎓" },
  { value: "GROOMING", label: "Grooming", icon: "✂️" },
  { value: "DAYCARE", label: "Doggy Daycare", icon: "🏠" },
  { value: "BOARDING", label: "Boarding", icon: "🏨" },
  { value: "PET_SITTING", label: "Pet Sitting", icon: "👨‍💼" },
  { value: "PET_TRANSPORT", label: "Pet Transport", icon: "🚗" },
  { value: "MOBILE_VET", label: "Mobile Vet", icon: "🏥" }
] as const;

const FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "AD_HOC", label: "As needed" },
  { value: "WEEKENDS_ONLY", label: "Weekends only" }
] as const;

// Define service and frequency enums with proper types
const ServiceTypeEnum = z.enum(["WALKING", "TRAINING", "GROOMING", "DAYCARE", "BOARDING", "PET_SITTING", "PET_TRANSPORT", "MOBILE_VET"]);
const FrequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "AD_HOC", "WEEKENDS_ONLY"]);
const LeadTypeEnum = z.enum(["OWNER", "SUPPLIER"]);

// Form validation schema with conditional logic
const rolloutLeadSchema = z.object({
  leadType: LeadTypeEnum.optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobilePhone: z.string().optional(),
  city: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  
  // Conditional owner path
  ownerServices: z.array(z.object({
    service: ServiceTypeEnum,
    frequency: FrequencyEnum.optional(),
  })).optional(),
  
  // Conditional supplier path  
  supplierServices: z.array(ServiceTypeEnum).optional(),
  serviceAreas: z.array(z.string()).optional(),
}).refine((data) => {
  // Conditional validation based on leadType
  if (data.leadType === "OWNER") {
    return data.ownerServices && data.ownerServices.length > 0;
  } else if (data.leadType === "SUPPLIER") {
    return data.supplierServices && data.supplierServices.length > 0 && 
           data.serviceAreas && data.serviceAreas.length > 0;
  }
  return true;
}, {
  message: "Please complete all required fields for your selected user type",
  path: ["leadType"]
});

type RolloutLeadForm = z.infer<typeof rolloutLeadSchema>;

export default function RolloutLead() {
  const { toast } = useToast();

  // Fetch suburbs using React Query (same pattern as owner-signup)
  const { data: suburbsData, isLoading: suburbsLoading } = useQuery({
    queryKey: ['/api/suburbs'],
    queryFn: async () => {
      const response = await fetch('/api/suburbs');
      const data = await response.json();
      return data.suburbs || [];
    }
  });

  const form = useForm({
    resolver: zodResolver(rolloutLeadSchema),
    defaultValues: {
      leadType: undefined,
      fullName: "",
      email: "",
      mobilePhone: "",
      city: "",
      marketingOptIn: false,
      ownerServices: [],
      supplierServices: [],
      serviceAreas: []
    }
  });

  const { fields: ownerServiceFields, append: addOwnerService, remove: removeOwnerService } = useFieldArray({
    control: form.control as Control<any>,
    name: "ownerServices"
  });

  const leadType = form.watch("leadType");
  const supplierServices = form.watch("supplierServices") || [];
  const serviceAreas = form.watch("serviceAreas") || [];
  const suburbs = suburbsData || [];

  // Reset conditional sections when leadType changes
  useEffect(() => {
    if (leadType === "OWNER") {
      form.setValue("supplierServices", []);
      form.setValue("serviceAreas", []);
    } else if (leadType === "SUPPLIER") {
      form.setValue("ownerServices", []);
    }
  }, [leadType, form]);

  const submitMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("/api/rollout-leads", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: (data: any) => {
      toast({
        title: "Thank you for your interest!",
        description: `We've received your ${leadType?.toLowerCase()} registration and will contact you soon about our rollout.`
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Please check your information and try again."
      });
    }
  });

  const onSubmit = (data: any) => {
    submitMutation.mutate(data);
  };

  const toggleSupplierService = (service: string) => {
    const currentServices = supplierServices as string[];
    const updatedServices = currentServices.includes(service) 
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    form.setValue("supplierServices", updatedServices as any);
  };

  const toggleServiceArea = (suburbId: string) => {
    const currentAreas = serviceAreas;
    const updatedAreas = currentAreas.includes(suburbId)
      ? currentAreas.filter(a => a !== suburbId)
      : [...currentAreas, suburbId];
    form.setValue("serviceAreas", updatedAreas);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join the DogLife Rollout</h1>
          <p className="text-lg text-gray-600">
            Be among the first to experience DogLife in your area. Register your interest and we'll notify you when we launch!
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* User Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  I am interested as a...
                </CardTitle>
                <CardDescription>
                  Choose whether you're a dog owner looking for services or a service provider wanting to join our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control as Control<any>}
                  name="leadType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          data-testid="radio-leadType"
                        >
                          <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                            <RadioGroupItem value="OWNER" id="owner" data-testid="radio-owner" />
                            <label htmlFor="owner" className="flex items-center gap-3 cursor-pointer">
                              <Heart className="h-5 w-5 text-orange-500" />
                              <div>
                                <div className="font-semibold">Dog Owner</div>
                                <div className="text-sm text-gray-600">Looking for services for my dog(s)</div>
                              </div>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                            <RadioGroupItem value="SUPPLIER" id="supplier" data-testid="radio-supplier" />
                            <label htmlFor="supplier" className="flex items-center gap-3 cursor-pointer">
                              <Building className="h-5 w-5 text-orange-500" />
                              <div>
                                <div className="font-semibold">Service Provider</div>
                                <div className="text-sm text-gray-600">Want to offer services to dog owners</div>
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📧 Contact Information
                </CardTitle>
                <CardDescription>
                  How can we reach you when DogLife launches in your area?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control as Control<any>}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-fullName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as Control<any>}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as Control<any>}
                    name="mobilePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-mobilePhone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as Control<any>}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Cape Town, Johannesburg, Durban" data-testid="input-city" />
                      </FormControl>
                      <FormDescription>
                        Help us prioritize rollout areas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Conditional Owner Path */}
            {leadType === "OWNER" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🐕 Service Interests
                  </CardTitle>
                  <CardDescription>
                    What services are you interested in for your dog(s)?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Select Services</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOwnerService({ service: "WALKING" as const })}
                        data-testid="button-addOwnerService"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </div>

                    {ownerServiceFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <FormField
                            control={form.control as Control<any>}
                            name={`ownerServices.${index}.service`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-ownerService-${index}`}>
                                      <SelectValue placeholder="Select a service" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SERVICE_TYPES.map((service) => (
                                      <SelectItem key={service.value} value={service.value}>
                                        <span className="flex items-center gap-2">
                                          <span>{service.icon}</span>
                                          {service.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <FormField
                            control={form.control as Control<any>}
                            name={`ownerServices.${index}.frequency`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-ownerFrequency-${index}`}>
                                      <SelectValue placeholder="How often? (Optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {FREQUENCY_OPTIONS.map((freq) => (
                                      <SelectItem key={freq.value} value={freq.value}>
                                        {freq.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOwnerService(index)}
                          data-testid={`button-removeOwnerService-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {ownerServiceFields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No services selected yet. Click "Add Service" to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conditional Supplier Path */}
            {leadType === "SUPPLIER" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏪 Service Offering
                  </CardTitle>
                  <CardDescription>
                    What services will you provide and where will you operate?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Services You'll Provide</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {SERVICE_TYPES.map((service) => (
                        <div
                          key={service.value}
                          className={cn(
                            "p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-orange-300",
                            supplierServices.includes(service.value) 
                              ? "border-orange-500 bg-orange-50" 
                              : "border-gray-200"
                          )}
                          onClick={() => toggleSupplierService(service.value)}
                          data-testid={`supplier-service-${service.value}`}
                        >
                          <div className="text-center">
                            <div className="text-xl mb-1">{service.icon}</div>
                            <div className="text-xs font-medium">{service.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {supplierServices.length === 0 && (
                      <p className="text-sm text-red-500 mt-2">Please select at least one service</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Service Areas
                    </h4>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {suburbsLoading ? (
                        <p className="text-center text-gray-500">Loading suburbs...</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suburbs.map((suburb: any) => (
                            <div 
                              key={suburb.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                checked={serviceAreas.includes(suburb.id)}
                                onCheckedChange={() => toggleServiceArea(suburb.id)}
                                data-testid={`checkbox-suburb-${suburb.id}`}
                              />
                              <label className="text-sm">
                                {suburb.suburbName}, {suburb.city}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {serviceAreas.length === 0 && (
                      <p className="text-sm text-red-500 mt-2">Please select at least one service area</p>
                    )}
                    {serviceAreas.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Selected areas ({serviceAreas.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {serviceAreas.slice(0, 5).map((areaId) => {
                            const suburb = suburbs.find((s: any) => s.id === areaId);
                            return suburb ? (
                              <Badge key={areaId} variant="secondary" className="text-xs">
                                {suburb.suburbName}
                              </Badge>
                            ) : null;
                          })}
                          {serviceAreas.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{serviceAreas.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marketing Opt-in */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control as Control<any>}
                  name="marketingOptIn"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-marketingOptIn"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Keep me updated about DogLife's progress and launch
                        </FormLabel>
                        <FormDescription>
                          Get notified about rollout updates, early access opportunities, and special launch offers
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button
                type="submit"
                size="lg"
                disabled={submitMutation.isPending}
                loading={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? "Submitting..." : "Join the Rollout"}
              </Button>
              
              {!leadType && (
                <p className="text-sm text-red-500 mt-2">Please select whether you're a dog owner or service provider</p>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}