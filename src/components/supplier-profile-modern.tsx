import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, Clock, DollarSign, Shield, Plus, Trash2, Edit2, Check } from "lucide-react";

// Schema for supplier profile form
const supplierProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerFirstName: z.string().min(1, "Owner first name is required"),
  ownerLastName: z.string().min(1, "Owner last name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  businessDescription: z.string().min(20, "Description must be at least 20 characters"),
  businessLogoUrl: z.string().url().optional().or(z.literal("")),
  serviceRadiusKm: z.coerce.number().min(1).max(100),
  services: z.array(z.string()).min(1, "Select at least one service"),
  operatingSuburbs: z.array(z.string()).min(1, "Select at least one suburb"),
  availabilityDays: z.array(z.string()).min(1, "Select at least one day"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  blackoutDates: z.string().optional(),
  sizeLimitations: z.string().optional(),
  specialNeedsExperience: z.string().optional(),
  certifications: z.string().optional(),
  cancellationPolicy: z.string().min(20, "Cancellation policy is required"),
  reschedulingPolicy: z.string().min(20, "Rescheduling policy is required"),
  insuranceDetails: z.string().min(20, "Insurance details are required"),
});

type SupplierProfileFormData = z.infer<typeof supplierProfileSchema>;

const SERVICES = [
  "Dog Walking", "Pet Sitting", "Boarding", "Grooming", "Training", 
  "Doggy Daycare", "Vet Services", "Pet Transport"
];

const SUBURBS = [
  "Sandton", "Fourways", "Midrand", "Centurion", "Pretoria", "Johannesburg",
  "Randburg", "Roodepoort", "Kempton Park", "Bedfordview", "Germiston"
];

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

interface PricingRow {
  id: string;
  serviceType: string;
  duration: string;
  price: string;
}

export default function SupplierProfileModern() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("business");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([
    { id: "1", serviceType: "", duration: "", price: "" }
  ]);

  const form = useForm<SupplierProfileFormData>({
    resolver: zodResolver(supplierProfileSchema),
    defaultValues: {
      businessName: "",
      ownerFirstName: "",
      ownerLastName: "",
      contactEmail: "",
      contactPhone: "",
      businessAddress: "",
      businessDescription: "",
      businessLogoUrl: "",
      serviceRadiusKm: 10,
      services: [],
      operatingSuburbs: [],
      availabilityDays: [],
      startTime: "08:00",
      endTime: "17:00",
      blackoutDates: "",
      sizeLimitations: "",
      specialNeedsExperience: "",
      certifications: "",
      cancellationPolicy: "",
      reschedulingPolicy: "",
      insuranceDetails: "",
    },
  });

  // Load existing profile data
  useEffect(() => {
    loadSupplierProfile();
  }, []);

  const loadSupplierProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/supplier/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Populate form with existing data
        form.reset(data);
        if (data.pricing?.general) {
          setPricingRows(data.pricing.general);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const onSubmit = async (data: SupplierProfileFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        ...data,
        pricing: {
          general: pricingRows,
        }
      };

      const response = await fetch('/api/supplier/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your business profile has been saved successfully!",
        });
        setIsEditing(false);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPricingRow = () => {
    setPricingRows([...pricingRows, { 
      id: Date.now().toString(), 
      serviceType: "", 
      duration: "", 
      price: "" 
    }]);
  };

  const removePricingRow = (id: string) => {
    setPricingRows(pricingRows.filter(row => row.id !== id));
  };

  const updatePricingRow = (id: string, field: keyof Omit<PricingRow, 'id'>, value: string) => {
    setPricingRows(pricingRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={form.getValues("businessLogoUrl")} />
                <AvatarFallback>
                  <Building className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{form.getValues("businessName") || "Your Business"}</CardTitle>
                <p className="text-doglife-neutral">
                  {form.getValues("ownerFirstName")} {form.getValues("ownerLastName")}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <MapPin className="h-4 w-4 text-doglife-neutral" />
                  <span className="text-sm text-doglife-neutral">
                    {form.getValues("businessAddress") || "Address not set"}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)} className="bg-doglife-primary hover:bg-blue-700">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-doglife-neutral">
              {form.getValues("businessDescription") || "No description provided"}
            </p>
          </CardContent>
        </Card>

        {/* Services Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(form.getValues("services") || []).map((service) => (
                <Badge key={service} variant="secondary">{service}</Badge>
              ))}
              {(form.getValues("services") || []).length === 0 && (
                <p className="text-doglife-neutral">No services configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coverage Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Coverage Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(form.getValues("operatingSuburbs") || []).map((suburb) => (
                <Badge key={suburb} variant="outline">{suburb}</Badge>
              ))}
              {(form.getValues("operatingSuburbs") || []).length === 0 && (
                <p className="text-doglife-neutral">No coverage areas configured</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Business Profile</CardTitle>
          <p className="text-doglife-neutral">
            Manage your business information and service offerings
          </p>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            {/* Business Details Tab */}
            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="businessLogoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Logo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceRadiusKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Radius (km)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" max="100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Services & Coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>Services Offered</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {SERVICES.map((service) => (
                            <FormField
                              key={service}
                              control={form.control}
                              name="services"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...(field.value || []), service]
                                          : field.value?.filter((value) => value !== service) || [];
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {service}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingSuburbs"
                    render={() => (
                      <FormItem>
                        <FormLabel>Operating Suburbs</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {SUBURBS.map((suburb) => (
                            <FormField
                              key={suburb}
                              control={form.control}
                              name="operatingSuburbs"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(suburb)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...(field.value || []), suburb]
                                          : field.value?.filter((value) => value !== suburb) || [];
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {suburb}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Service Pricing
                    <Button
                      type="button"
                      onClick={addPricingRow}
                      size="sm"
                      className="bg-doglife-primary hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pricingRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="text-sm font-medium">Service Type</label>
                          <Input
                            value={row.serviceType}
                            onChange={(e) => updatePricingRow(row.id, 'serviceType', e.target.value)}
                            placeholder="e.g., Dog Walking"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration</label>
                          <Input
                            value={row.duration}
                            onChange={(e) => updatePricingRow(row.id, 'duration', e.target.value)}
                            placeholder="e.g., 30 minutes"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Price (R)</label>
                          <Input
                            value={row.price}
                            onChange={(e) => updatePricingRow(row.id, 'price', e.target.value)}
                            placeholder="e.g., 150"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePricingRow(row.id)}
                          disabled={pricingRows.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Availability Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="availabilityDays"
                    render={() => (
                      <FormItem>
                        <FormLabel>Operating Days</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {DAYS.map((day) => (
                            <FormField
                              key={day}
                              control={form.control}
                              name="availabilityDays"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...(field.value || []), day]
                                          : field.value?.filter((value) => value !== day) || [];
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {day}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="blackoutDates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blackout Dates (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="List any dates when you're unavailable..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies">
              <Card>
                <CardHeader>
                  <CardTitle>Business Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cancellationPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation Policy</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reschedulingPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rescheduling Policy</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insuranceDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Details</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sizeLimitations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size Limitations (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} placeholder="Any restrictions on animal sizes..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialNeedsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Needs Experience (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} placeholder="Experience with special needs animals..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} placeholder="List any relevant certifications..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-doglife-primary hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Profile"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}