import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, Loader2, User, Mail, Phone, Lock, Building, MapPin, FileText, Shield, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AddressAutocomplete } from "@/components/address-autocomplete";

const providerRegistrationSchema = z.object({
  // Basic Information
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobileNumber: z.string().min(10, "Please enter a valid mobile number"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  
  // Location
  suburb: z.string().min(1, "Please enter your suburb/area"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Service Information
  selectedServices: z.array(z.string()).min(1, "Please select at least one service"),
  aboutServices: z.string().min(10, "Please describe your services (minimum 10 characters)"),
  
  // Provider Type
  providerType: z.enum(["business", "individual"]),
  
  // Business Fields (conditional)
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  registrationNumber: z.string().optional(),
  
  // Individual Fields (conditional)
  backgroundCheckExpiry: z.object({
    month: z.string().optional(),
    year: z.string().optional(),
  }).optional(),
  
  // Agreement
  termsAccepted: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.providerType === "business") {
    return data.businessName && data.businessAddress && data.businessPhone;
  }
  return true;
}, {
  message: "Business information is required for business providers",
  path: ["businessName"],
});

type ProviderRegistrationFormData = z.infer<typeof providerRegistrationSchema>;

const availableServices = [
  "Walking", "Grooming", "Training", "Boarding", "Pet Sitting", 
  "Doggy Daycare", "Vet Services", "Pet Transport", "Dog Photography"
];

// Testing phase: Limited to Johannesburg and Sandton suburbs only
const southAfricanSuburbs = [
  // Johannesburg Area
  "Bryanston", "Craighall", "Dainfern", "Emmarentia", "Ferndale", "Fourways", 
  "Greenside", "Hyde Park", "Linden", "Lone Hill", "Melrose", "Morningside", 
  "Northcliff", "Parkhurst", "Paulshof", "Randburg", "Rivonia", "Rosebank", 
  "Sunninghill", "Woodmead",
  
  // Sandton Area  
  "Sandton", "Sandton City", "Benmore", "Illovo", "Wendywood", "Bryanston East",
  "Morningside Manor", "Hurlingham", "Gallo Manor", "Douglasdale"
].sort();

interface ProviderRegistrationFormProps {
  onSuccess?: () => void;
}

export default function ProviderRegistrationForm({ onSuccess }: ProviderRegistrationFormProps) {
  const { registerMutation } = useAuth();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [businessDocs, setBusinessDocs] = useState<File | null>(null);
  const [businessLogo, setBusinessLogo] = useState<File | null>(null);
  const [huruBackgroundCheck, setHuruBackgroundCheck] = useState<File | null>(null);
  const [certification, setCertification] = useState<File | null>(null);

  const form = useForm<ProviderRegistrationFormData>({
    resolver: zodResolver(providerRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      suburb: "",
      address: "",
      city: "",
      province: "",
      latitude: undefined,
      longitude: undefined,
      selectedServices: [],
      aboutServices: "",
      providerType: "individual",
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      registrationNumber: "",
      backgroundCheckExpiry: {
        month: "",
        year: "",
      },
      termsAccepted: false,
    },
  });

  const providerType = form.watch("providerType");

  const handleServiceToggle = (service: string) => {
    const updatedServices = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service];
    
    setSelectedServices(updatedServices);
    form.setValue("selectedServices", updatedServices);
  };

  const onSubmit = async (data: ProviderRegistrationFormData) => {
    try {
      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const registrationData = {
        email: data.email,
        password: data.password,
        firstName,
        lastName,
        phoneNumber: data.mobileNumber,
        userType: 'provider' as const,
        // Provider-specific data
        providerData: {
          suburb: data.suburb,
          servicesOffered: data.selectedServices,
          aboutServices: data.aboutServices,
          providerType: data.providerType,
          businessName: data.businessName,
          businessAddress: data.businessAddress,
          businessPhone: data.businessPhone,
          businessRegistration: data.registrationNumber,
          backgroundCheckExpiry: data.backgroundCheckExpiry,
          termsAccepted: data.termsAccepted,
          termsAcceptedAt: new Date().toISOString(),
          // File uploads would be handled separately in a real implementation
          profilePictureUrl: null,
          businessDocsUrl: null,
          logoUrl: null,
          huruBackgroundCheckUrl: null,
          certificationUrl: null,
        }
      };

      // Register the user first
      const registerResult = await registerMutation.mutateAsync(registrationData);
      
      // After successful registration, sync to Zoho CRM
      if (registerResult) {
        try {
          console.log('Syncing supplier registration to Zoho CRM...');
          const zohoSyncData = {
            fullName: data.fullName,
            email: data.email,
            mobileNumber: data.mobileNumber,
            suburb: data.suburb,
            selectedServices: data.selectedServices,
            aboutServices: data.aboutServices,
            providerType: data.providerType,
            businessName: data.businessName,
            businessAddress: data.businessAddress,
            businessPhone: data.businessPhone,
            registrationNumber: data.registrationNumber,
            backgroundCheckExpiry: data.backgroundCheckExpiry,
            termsAccepted: data.termsAccepted,
            termsAcceptedAt: new Date().toISOString()
          };

          // Sync to Zoho (don't block registration if this fails)
          await fetch('/api/supplier/sync-to-zoho', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${registerResult.token}` // Use token from registration
            },
            body: JSON.stringify(zohoSyncData)
          }).then(res => res.json()).then(result => {
            console.log('Zoho sync result:', result);
            if (result.success) {
              console.log(`Supplier ${result.action} in Zoho CRM with ID: ${result.zohoId}`);
            }
          });
        } catch (zohoError) {
          console.error('Zoho sync failed (registration still successful):', zohoError);
        }
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create a Service Provider Account</CardTitle>
        <CardDescription>
          Join our network of trusted dog service providers
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="Enter your full name" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="your@email.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="tel" placeholder="+27 123 456 7890" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="password" placeholder="Password" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="password" placeholder="Confirm password" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        value={field.value || ""}
                        onChange={(address, details) => {
                          field.onChange(address);
                          if (details) {
                            form.setValue("suburb", details.suburb || details.city);
                            form.setValue("city", details.city);
                            form.setValue("province", details.province);
                            if (details.latitude) form.setValue("latitude", details.latitude);
                            if (details.longitude) form.setValue("longitude", details.longitude);
                          }
                        }}
                        placeholder="Start typing your business address..."
                        showNearMe={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profile Picture Upload */}
              <div>
                <Label>Upload Profile Picture</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Services</h3>
              <FormField
                control={form.control}
                name="selectedServices"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-3 gap-2">
                      {availableServices.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={selectedServices.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                          />
                          <Label
                            htmlFor={service}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aboutServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Your Services</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your services, experience, and what makes you unique..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Provider Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Provider Type</h3>
              <FormField
                control={form.control}
                name="providerType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="business" id="business" />
                          <Label htmlFor="business" className="cursor-pointer">Business</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="cursor-pointer">Individual</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Business Information (Conditional) */}
            {providerType === "business" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600">Business Information</h3>
                
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Your business name" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Full business address" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="tel" placeholder="Business phone number" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Business registration number" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Upload Business Documents (optional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setBusinessDocs(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Business Logo (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBusinessLogo(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Individual Information (Conditional) */}
            {providerType === "individual" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-green-600">Individual Provider Information</h3>
                
                <div className="space-y-2">
                  <Label>Upload HURU Background Check</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setHuruBackgroundCheck(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Check Expiry Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="backgroundCheckExpiry.month"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                  {new Date(0, i).toLocaleDateString('en', { month: 'long' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="backgroundCheckExpiry.year"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return (
                                  <SelectItem key={year} value={String(year)}>
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Certification (optional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => setCertification(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        I agree to the Terms & Conditions
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Submit & Continue to Verification"
              )}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}