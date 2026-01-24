import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { 
  Plus, 
  Trash2, 
  Upload, 
  User, 
  Heart, 
  MapPin, 
  Settings, 
  Shield, 
  Stethoscope,
  Bell,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Enhanced schemas
const petSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Pet name is required"),
  breed: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female", "Unknown"]).default("Unknown"),
  weightKg: z.number().min(0).max(120).optional(),
  microchip: z.string().optional(),
  vaccinations: z.array(z.object({
    type: z.string(),
    expiry: z.string()
  })).optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  behavioralNotes: z.string().optional(),
  photoPath: z.string().optional(),
});

const ownerProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  street: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().regex(/^\d{4}$/, "Postal code must be 4 digits").optional(),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  preferredSuburbs: z.array(z.string()).optional(),
  defaultServices: z.array(z.string()).optional(),
  specialInstructions: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  vetName: z.string().optional(),
  vetPhone: z.string().optional(),
  vetAddress: z.string().optional(),
  notifEmail: z.boolean().default(true),
  notifSms: z.boolean().default(false),
  notifWhatsapp: z.boolean().default(false),
  plan: z.enum(["Free", "DogLife+"]).default("Free"),
  pets: z.array(petSchema).min(1, "At least one pet is required"),
});

type OwnerProfileFormData = z.infer<typeof ownerProfileSchema>;

const defaultServices = [
  "Walking", "Daycare", "Boarding", "Grooming", "Training", "Transport", "Mobile Vet"
];

export default function EnhancedOwnerProfile() {
  const [completeness, setCompleteness] = useState(0);
  const [collapsedPets, setCollapsedPets] = useState<Record<number, boolean>>({});
  const [suburbSearch, setSuburbSearch] = useState('');
  const queryClient = useQueryClient();

  // Grouped suburbs by areas (same as supplier profile)
  const gautengAreas: Record<string, string[]> = {
    'Johannesburg North': [
      'Auckland Park', 'Blairgowrie', 'Bryanston', 'Craighall', 'Craighall Park', 
      'Dainfern', 'Dunkeld', 'Emmarentia', 'Fourways', 'Greenside', 'Houghton', 
      'Hyde Park', 'Illovo', 'Killarney', 'Linden', 'Magaliessig', 'Melville', 
      'Morningside', 'Northcliff', 'Northriding', 'Parkhurst', 'Parktown', 
      'Paulshof', 'Randburg', 'Randpark Ridge', 'Rivonia', 'Rosebank', 
      'Sandton', 'Saxonwold', 'Sunninghill'
    ],
    'Johannesburg West': [
      'Constantia Kloof', 'Florida', 'Florida Glen', 'Helderkruin', 'Honeydew', 
      'Kagiso', 'Krugersdorp', 'Mohlakeng', 'Monument', 'Munsieville', 
      'Noordheuwel', 'Rangeview', 'Roodepoort', 'Weltevreden Park', 'Wilgeheuwel'
    ],
    'West Rand': [
      'Bekkersdal', 'Carletonville', 'Fochville', 'Khutsong', 'Kingsway', 
      'Kokosi', 'Merafong City', 'Simunye', 'Venterspost', 'Westonaria'
    ],
    'East Rand': [
      'Alberton', 'Bedfordview', 'Benoni', 'Boksburg', 'Brakpan', 
      'Edenvale', 'Germiston', 'Kempton Park', 'Springs'
    ],
    'Central Johannesburg': [
      'Alexandra', 'Diepsloot', 'Johannesburg CBD', 'Midrand', 'Soweto'
    ]
  };

  // Flatten all suburbs for search functionality
  const allSuburbs = Object.values(gautengAreas).flat();

  // Filter areas and suburbs based on search
  const filteredAreas = Object.keys(gautengAreas).filter((area: string) =>
    area.toLowerCase().includes(suburbSearch.toLowerCase()) ||
    gautengAreas[area].some((suburb: string) =>
      suburb.toLowerCase().includes(suburbSearch.toLowerCase())
    )
  );

  const filteredSuburbs = allSuburbs.filter((suburb: string) =>
    suburb.toLowerCase().includes(suburbSearch.toLowerCase())
  );

  const form = useForm<OwnerProfileFormData>({
    resolver: zodResolver(ownerProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      preferredContact: "email",
      preferredSuburbs: [],
      defaultServices: [],
      emergencyName: "",
      emergencyPhone: "",
      notifEmail: true,
      notifSms: false,
      notifWhatsapp: false,
      plan: "Free",
      pets: [{
        name: "",
        breed: "",
        gender: "Unknown",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pets"
  });

  // Removed suburbs loading - now using gautengAreas static data

  // Load existing profile
  const { data: profile } = useQuery({
    queryKey: ["/api/owner/profile"],
    enabled: true,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile && typeof profile === 'object') {
      const profileData = profile as any;
      form.reset({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        phoneNumber: profileData.phoneNumber || "",
        street: profileData.street || "",
        suburb: profileData.suburb || "",
        city: profileData.city || "",
        province: profileData.province || "",
        postalCode: profileData.postalCode || "",
        preferredContact: profileData.preferredContact || "email",
        preferredSuburbs: profileData.preferredSuburbs || [],
        defaultServices: profileData.defaultServices || [],
        specialInstructions: profileData.specialInstructions || "",
        emergencyName: profileData.emergencyName || "",
        emergencyPhone: profileData.emergencyPhone || "",
        vetName: profileData.vetName || "",
        vetPhone: profileData.vetPhone || "",
        vetAddress: profileData.vetAddress || "",
        notifEmail: profileData.notifEmail ?? true,
        notifSms: profileData.notifSms ?? false,
        notifWhatsapp: profileData.notifWhatsapp ?? false,
        plan: profileData.plan || "Free",
        pets: profileData.pets?.length > 0 ? profileData.pets.map((pet: any) => ({
          name: pet.name || "",
          breed: pet.breed || "",
          gender: pet.gender || "Unknown",
        })) : [{
          name: "",
          breed: "",
          gender: "Unknown",
        }],
      });
    }
  }, [profile, form]);

  // Calculate completeness
  useEffect(() => {
    const values = form.watch();
    const totalFields = 15; // Approximate number of important fields
    let completed = 0;
    
    if (values.firstName) completed++;
    if (values.lastName) completed++;
    if (values.email) completed++;
    if (values.phoneNumber) completed++;
    if (values.street) completed++;
    if (values.suburb) completed++;
    if (values.emergencyName) completed++;
    if (values.emergencyPhone) completed++;
    if (values.pets?.[0]?.name) completed++;
    if (values.preferredSuburbs?.length) completed++;
    if (values.defaultServices?.length) completed++;
    
    setCompleteness(Math.round((completed / totalFields) * 100));
  }, [form.watch()]);

  const saveMutation = useMutation({
    mutationFn: async (data: OwnerProfileFormData) => {
      console.log("Saving profile data:", data);
      const response = await apiRequest("/api/owner/profile", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (response) => {
      console.log("Profile save success:", response);
      toast({
        title: "Success",
        description: "Profile saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/profile"] });
    },
    onError: (error: any) => {
      console.error("Profile save error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OwnerProfileFormData) => {
    saveMutation.mutate(data);
  };

  const addPet = () => {
    append({
      name: "",
      breed: "",
      gender: "Unknown",
    });
  };

  const removePet = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const togglePetCollapse = (index: number) => {
    setCollapsedPets(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-doglife-dark">Dog Owner Profile</h1>
        <p className="text-doglife-neutral">Complete your profile to book services easily</p>
        
        {/* Progress bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Profile Completeness</span>
            <span className="font-medium">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
            <CardDescription>Your personal contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  className={form.formState.errors.firstName ? "border-red-500" : ""}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  className={form.formState.errors.lastName ? "border-red-500" : ""}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Mobile *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...form.register("phoneNumber")}
                  className={form.formState.errors.phoneNumber ? "border-red-500" : ""}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-medium text-doglife-dark">Address</h4>
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" {...form.register("street")} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="suburb">Suburb</Label>
                  <Select 
                    value={form.watch("suburb") || ""} 
                    onValueChange={(value) => form.setValue("suburb", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select suburb" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSuburbs.map(suburb => (
                        <SelectItem key={suburb} value={suburb}>{suburb}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...form.register("city")} />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input 
                    id="postalCode" 
                    {...form.register("postalCode")}
                    placeholder="4 digits" 
                    className={form.formState.errors.postalCode ? "border-red-500" : ""}
                  />
                  {form.formState.errors.postalCode && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.postalCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <Label>Preferred Contact Method</Label>
              <RadioGroup
                value={form.watch("preferredContact")}
                onValueChange={(value: "email" | "phone" | "whatsapp") => 
                  form.setValue("preferredContact", value)
                }
                className="flex flex-row space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email-contact" />
                  <Label htmlFor="email-contact">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone-contact" />
                  <Label htmlFor="phone-contact">Phone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp-contact" />
                  <Label htmlFor="whatsapp-contact">WhatsApp</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Pets Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Your Pets
            </CardTitle>
            <CardDescription>Add information about your dogs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Pet {index + 1}: {form.watch(`pets.${index}.name`) || "Unnamed"}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePetCollapse(index)}
                      >
                        {collapsedPets[index] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePet(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {!collapsedPets[index] && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`pets.${index}.name`}>Pet Name *</Label>
                        <Input
                          {...form.register(`pets.${index}.name`)}
                          className={form.formState.errors.pets?.[index]?.name ? "border-red-500" : ""}
                        />
                        {form.formState.errors.pets?.[index]?.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.pets[index].name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`pets.${index}.breed`}>Breed</Label>
                        <Input {...form.register(`pets.${index}.breed`)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`pets.${index}.dob`}>Date of Birth</Label>
                        <Input
                          type="date"
                          {...form.register(`pets.${index}.dob`)}
                        />
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <Select 
                          value={form.watch(`pets.${index}.gender`) || "Unknown"} 
                          onValueChange={(value: "Male" | "Female" | "Unknown") => 
                            form.setValue(`pets.${index}.gender`, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`pets.${index}.weightKg`}>Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="120"
                          {...form.register(`pets.${index}.weightKg`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`pets.${index}.microchip`}>Microchip Number</Label>
                      <Input {...form.register(`pets.${index}.microchip`)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`pets.${index}.medicalConditions`}>Medical Conditions</Label>
                        <Textarea 
                          {...form.register(`pets.${index}.medicalConditions`)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`pets.${index}.allergies`}>Allergies</Label>
                        <Textarea 
                          {...form.register(`pets.${index}.allergies`)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`pets.${index}.behavioralNotes`}>Behavior Notes</Label>
                      <Textarea 
                        {...form.register(`pets.${index}.behavioralNotes`)}
                        rows={3}
                        placeholder="Any special behavioral notes or training requirements..."
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addPet}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Pet
            </Button>
          </CardContent>
        </Card>

        {/* Service Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Service Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preferred Suburbs</Label>
              <div className="mt-2">
                {/* Search Input */}
                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="Search areas or suburbs..."
                    value={suburbSearch}
                    onChange={(e) => setSuburbSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {suburbSearch ? (
                    // Show flat search results when searching
                    <div className="p-3 space-y-2">
                      {filteredSuburbs.map(suburb => (
                        <div key={suburb} className="flex items-center space-x-2">
                          <Checkbox
                            id={`suburb-${suburb}`}
                            checked={form.watch("preferredSuburbs")?.includes(suburb) || false}
                            onCheckedChange={(checked) => {
                              const current = form.watch("preferredSuburbs") || [];
                              if (checked) {
                                form.setValue("preferredSuburbs", [...current, suburb]);
                              } else {
                                form.setValue("preferredSuburbs", current.filter(s => s !== suburb));
                              }
                            }}
                          />
                          <Label htmlFor={`suburb-${suburb}`} className="text-sm">{suburb}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Show grouped areas when not searching
                    <div className="divide-y">
                      {Object.entries(gautengAreas).map(([area, suburbs]) => (
                        <div key={area} className="p-3">
                          <div className="font-medium text-blue-600 mb-2">{area}</div>
                          <div className="space-y-1 pl-4">
                            {suburbs.map(suburb => (
                              <div key={suburb} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`suburb-${suburb}`}
                                  checked={form.watch("preferredSuburbs")?.includes(suburb) || false}
                                  onCheckedChange={(checked) => {
                                    const current = form.watch("preferredSuburbs") || [];
                                    if (checked) {
                                      form.setValue("preferredSuburbs", [...current, suburb]);
                                    } else {
                                      form.setValue("preferredSuburbs", current.filter(s => s !== suburb));
                                    }
                                  }}
                                />
                                <Label htmlFor={`suburb-${suburb}`} className="text-sm">{suburb}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>Default Services</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                {defaultServices.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service}`}
                      checked={form.watch("defaultServices")?.includes(service) || false}
                      onCheckedChange={(checked) => {
                        const current = form.watch("defaultServices") || [];
                        if (checked) {
                          form.setValue("defaultServices", [...current, service]);
                        } else {
                          form.setValue("defaultServices", current.filter(s => s !== service));
                        }
                      }}
                    />
                    <Label htmlFor={`service-${service}`} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                {...form.register("specialInstructions")}
                rows={3}
                placeholder="Any special instructions that apply to all bookings..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency & Vet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency Contact & Vet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyName"
                  {...form.register("emergencyName")}
                  className={form.formState.errors.emergencyName ? "border-red-500" : ""}
                />
                {form.formState.errors.emergencyName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.emergencyName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Number *</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  {...form.register("emergencyPhone")}
                  className={form.formState.errors.emergencyPhone ? "border-red-500" : ""}
                />
                {form.formState.errors.emergencyPhone && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.emergencyPhone.message}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Regular Veterinarian
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vetName">Vet Name</Label>
                  <Input id="vetName" {...form.register("vetName")} />
                </div>
                <div>
                  <Label htmlFor="vetPhone">Vet Phone</Label>
                  <Input id="vetPhone" type="tel" {...form.register("vetPhone")} />
                </div>
              </div>
              <div>
                <Label htmlFor="vetAddress">Vet Address</Label>
                <Textarea id="vetAddress" {...form.register("vetAddress")} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Notification Preferences</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifEmail"
                    checked={form.watch("notifEmail")}
                    onCheckedChange={(checked) => form.setValue("notifEmail", !!checked)}
                  />
                  <Label htmlFor="notifEmail">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifSms"
                    checked={form.watch("notifSms")}
                    onCheckedChange={(checked) => form.setValue("notifSms", !!checked)}
                  />
                  <Label htmlFor="notifSms">SMS notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifWhatsapp"
                    checked={form.watch("notifWhatsapp")}
                    onCheckedChange={(checked) => form.setValue("notifWhatsapp", !!checked)}
                  />
                  <Label htmlFor="notifWhatsapp">WhatsApp notifications</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Plan</Label>
              <div className="mt-2 flex gap-4">
                <Badge variant={form.watch("plan") === "Free" ? "default" : "outline"}>
                  Free (2 bookings/month)
                </Badge>
                <Badge variant={form.watch("plan") === "DogLife+" ? "default" : "outline"}>
                  DogLife+ (Unlimited bookings)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saveMutation.isPending}
            className="bg-doglife-primary hover:bg-doglife-primary/90"
          >
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}