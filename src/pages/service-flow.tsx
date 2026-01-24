import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Star, Clock, ArrowLeft, ArrowRight, Home, Car } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/navbar";
import { GoogleMapsAutocomplete } from "@/components/google-maps-autocomplete";

interface Provider {
  id: number;
  businessName: string;
  description: string;
  rating: string;
  totalReviews: number;
  coveredSuburbs: string[];
  isVerified: boolean;
  user: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  services?: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    categoryName: string;
  }>;
}

interface Dog {
  id: number;
  name: string;
  breed: string;
  age: number;
  size: string;
  temperament: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
}

const serviceTypes = [
  { id: 1, name: "Dog Training", icon: "🎓", hasSuburb: true, hasSubOptions: false },
  { id: 2, name: "Dog Walking", icon: "🚶", hasSuburb: true, hasSubOptions: false },
  { id: 3, name: "Mobile Dog Grooming", icon: "✂️", hasSuburb: false, hasSubOptions: true, subOptions: ["Wash & Brush", "Full Grooming", "Nail Trim"] },
  { id: 4, name: "Dog Boarding", icon: "🏠", hasSuburb: true, hasSubOptions: false },
  { id: 5, name: "Doggy Daycare", icon: "🎾", hasSuburb: false, hasSubOptions: true, subOptions: ["Full Day", "Half Day"] },
  { id: 6, name: "Pet Sitting", icon: "👥", hasSuburb: false, hasSubOptions: true, subOptions: ["Full Day", "Overnight"] },
  { id: 7, name: "Pet Transport", icon: "🚗", hasSuburb: false, hasSubOptions: true, subOptions: ["At My Home", "At Sitter's Home"] },
  { id: 8, name: "Mobile Vet", icon: "🩺", hasSuburb: false, hasSubOptions: true, subOptions: ["Consultation", "Vaccination", "Health Check"] },
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

export default function ServiceFlow() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [addressSaveStatus, setAddressSaveStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({ loading: false, success: false, error: null });
  const [selectedDogs, setSelectedDogs] = useState<number[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [petDetails, setPetDetails] = useState<string>("");
  const [providerNotes, setProviderNotes] = useState<string>("");

  // Fetch user's dogs
  const { data: dogs = [] } = useQuery<Dog[]>({
    queryKey: ["/api/dogs"],
    enabled: isAuthenticated,
  });

  // Helper function to get selected service type
  const selectedServiceType = serviceTypes.find(st => st.id === selectedService);

  // Fetch providers based on selected service and suburb
  const { data: providersResponse = { suppliers: [] } } = useQuery<{ suppliers: any[] }>({
    queryKey: ["/api/public/suppliers", selectedService, selectedSuburb],
    enabled: !!selectedService && (!!selectedSuburb || !selectedServiceType?.hasSuburb),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSuburb) params.append('suburb', selectedSuburb);
      if (selectedServiceType?.name) params.append('service', selectedServiceType.name);
      
      const response = await fetch(`/api/public/suppliers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      console.log('Frontend received supplier data from Zoho:', data);
      return data;
    }
  });

  // Map Zoho supplier data to provider format for compatibility
  const providers = providersResponse.suppliers.map((supplier: any) => ({
    id: supplier.id || 'unknown',
    name: supplier.businessName || 'Unnamed Business',
    businessName: supplier.businessName || 'Unnamed Business',
    businessDescription: supplier.description || '',
    description: supplier.description || '',
    service: selectedServiceType?.name || '',
    services: supplier.services || [selectedServiceType?.name || ''],
    rate: supplier.rates?.find((r: any) => r.service === selectedServiceType?.name)?.price || 0,
    location: supplier.location || supplier.operatingSuburbs?.[0] || 'Unknown',
    coveredSuburbs: supplier.operatingSuburbs || [],
    contactInfo: supplier.contactInfo || {},
    verified: supplier.verified || false,
    rating: supplier.rating || 0,
    reviewCount: supplier.reviewCount || 0,
    totalReviews: supplier.reviewCount || 0
  }));

  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId);
    const serviceType = serviceTypes.find(st => st.id === serviceId);
    if (!serviceType?.hasSuburb && !serviceType?.hasSubOptions) {
      setCurrentStep(3); // Skip to dog selection
    } else if (serviceType?.hasSubOptions && !serviceType?.hasSuburb) {
      setCurrentStep(2.5); // Go to sub-options
    } else {
      setCurrentStep(2); // Go to suburb selection
    }
  };

  const handleSubOptionSelect = (option: string) => {
    setSelectedSubOption(option);
    if (selectedServiceType?.hasSuburb) {
      setCurrentStep(2); // Go to suburb selection
    } else {
      setCurrentStep(3); // Skip to dog selection
    }
  };

  const handleSuburbSelect = (suburb: string) => {
    setSelectedSuburb(suburb);
    setCurrentStep(3);
  };

  const handleAddressSelect = async (address: string, placeDetails?: any) => {
    setSelectedAddress(address);
    setAddressDetails(placeDetails);
    
    // Don't send anything if user clears the field
    if (!address.trim() || !placeDetails) {
      setAddressSaveStatus({ loading: false, success: false, error: null });
      return;
    }

    // Extract suburb from place details for compatibility with existing flow
    let extractedSuburb = '';
    let extractedStreet = '';
    let extractedCity = '';
    let extractedProvince = '';
    let extractedPostalCode = '';

    if (placeDetails?.address_components) {
      for (const component of placeDetails.address_components) {
        const types = component.types;
        
        if (types.includes('street_number')) {
          extractedStreet = component.long_name + ' ';
        } else if (types.includes('route')) {
          extractedStreet += component.long_name;
        } else if (types.includes('sublocality') || types.includes('neighborhood')) {
          extractedSuburb = component.long_name;
        } else if (types.includes('locality')) {
          extractedCity = component.long_name;
          if (!extractedSuburb) extractedSuburb = component.long_name; // fallback
        } else if (types.includes('administrative_area_level_1')) {
          extractedProvince = component.long_name;
        } else if (types.includes('postal_code')) {
          extractedPostalCode = component.long_name;
        }
      }
      
      setSelectedSuburb(extractedSuburb);
      
      console.log('🌍 Address selected - Details:', {
        formattedAddress: address,
        suburb: extractedSuburb,
        placeDetails
      });
    }

    // Save address to database
    setAddressSaveStatus({ loading: true, success: false, error: null });
    
    try {
      const addressData = {
        placeId: placeDetails.place_id,
        formattedAddress: address,
        latitude: placeDetails.geometry?.location?.lat(),
        longitude: placeDetails.geometry?.location?.lng(),
        street: extractedStreet.trim() || null,
        suburb: extractedSuburb || null,
        city: extractedCity || null,
        province: extractedProvince || null,
        postalCode: extractedPostalCode || null
      };

      console.log('💾 Saving address to database:', addressData);

      const response = await fetch('/api/owner/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include authentication cookies
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save address');
      }

      const result = await response.json();
      console.log('✅ Address saved successfully:', result);
      
      setAddressSaveStatus({ loading: false, success: true, error: null });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setAddressSaveStatus(prev => ({ ...prev, success: false }));
      }, 3000);

    } catch (error: any) {
      console.error('❌ Failed to save address:', error);
      setAddressSaveStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Could not save address, please try again'
      });
    }
  };

  const handleDogSelection = (dogId: number, checked: boolean) => {
    if (checked) {
      setSelectedDogs([...selectedDogs, dogId]);
    } else {
      setSelectedDogs(selectedDogs.filter(id => id !== dogId));
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setCurrentStep(6);
  };

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const handleBookingSubmit = async () => {
    try {
      const booking = {
        serviceId: selectedService,
        providerId: selectedProvider?.id,
        dogIds: selectedDogs,
        scheduledDate: selectedDate,
        timeSlot: selectedTimeSlot,
        suburb: selectedSuburb,
        serviceOption: selectedSubOption,
        petDetails,
        notes: providerNotes,
      };
      
      // Submit booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(booking),
      });

      if (response.ok) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-gray-600 mb-4">You need to be logged in to book services</p>
              <Button onClick={() => window.location.href = "/api/auth/login"}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? "bg-doglife-primary text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep} of 8
          </div>
        </div>

        {/* Step 1: Select Service Type */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {serviceTypes.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      selectedService === service.id ? "ring-2 ring-doglife-primary" : ""
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{service.icon}</div>
                      <div className="font-medium text-sm">{service.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2.5: Select Sub-Options */}
        {currentStep === 2.5 && selectedServiceType?.hasSubOptions && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Service Option</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedServiceType?.subOptions?.map((option: string) => (
                  <Card
                    key={option}
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      selectedSubOption === option ? "ring-2 ring-doglife-primary" : ""
                    }`}
                    onClick={() => handleSubOptionSelect(option)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="font-medium">{option}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Address/Suburb */}
        {currentStep === 2 && selectedServiceType?.hasSuburb && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Address</CardTitle>
              <p className="text-sm text-gray-600">
                Use Google Maps Autocomplete to find your exact address (testing GOOGLE_MAPS_BROWSER_KEY)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address with Google Maps Autocomplete
                  </label>
                  <GoogleMapsAutocomplete
                    id="owner-address"
                    value={selectedAddress}
                    onChange={handleAddressSelect}
                    placeholder="Enter your address"
                    className="w-full"
                    data-testid="input-address-autocomplete"
                  />
                </div>
                
                {/* Address save status feedback */}
                {addressSaveStatus.loading && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-700 text-sm">Saving address...</span>
                  </div>
                )}
                
                {addressSaveStatus.success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✅</span>
                      <span className="text-green-700 text-sm font-medium">Address saved successfully!</span>
                    </div>
                    <div className="text-green-600 text-sm mt-1">{selectedAddress}</div>
                  </div>
                )}
                
                {addressSaveStatus.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-600 mr-2">❌</span>
                      <span className="text-red-700 text-sm font-medium">Error saving address</span>
                    </div>
                    <div className="text-red-600 text-sm mt-1">{addressSaveStatus.error}</div>
                  </div>
                )}

                {addressDetails && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Selected Address Details:</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Formatted Address:</span> {addressDetails.formatted_address}</div>
                      {addressDetails.address_components && (
                        <div>
                          <span className="font-medium">Suburb:</span> {
                            addressDetails.address_components.find((c: any) => 
                              c.types.includes('sublocality') || 
                              c.types.includes('neighborhood') ||
                              c.types.includes('locality')
                            )?.long_name || 'Not found'
                          }
                        </div>
                      )}
                      <div><span className="font-medium">Place ID:</span> {addressDetails.place_id}</div>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">
                    Or choose from existing suburbs (fallback)
                  </label>
                  <Select value={selectedSuburb} onValueChange={handleSuburbSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your suburb" />
                    </SelectTrigger>
                    <SelectContent>
                      {southAfricanSuburbs.map((suburb) => (
                        <SelectItem key={suburb} value={suburb}>
                          {suburb}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(selectedSubOption ? 2.5 : 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!selectedSuburb}
                  data-testid="button-continue-address"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Choose Dogs */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose One or More Dogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dogs.map((dog) => (
                  <div key={dog.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedDogs.includes(dog.id)}
                      onCheckedChange={(checked) => handleDogSelection(dog.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{dog.name}</div>
                      <div className="text-sm text-gray-600">
                        {dog.breed} • {dog.age} years old • {dog.size}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(selectedServiceType?.hasSuburb ? 2 : (selectedServiceType?.hasSubOptions ? 2.5 : 1))}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(4)}
                  disabled={selectedDogs.length === 0}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Browse Providers */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Browse Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{provider.businessName}</h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {provider.coveredSuburbs?.[0] || 'Multiple areas'}
                          </div>
                          <div className="flex items-center mt-2">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm">{provider.rating} ({provider.totalReviews} reviews)</span>
                          </div>
                          <p className="text-gray-600 mt-2">{provider.description}</p>
                          {provider.services && provider.services.length > 0 && (
                            <div className="mt-2">
                              {/* Show training services first if this is a Dog Training search */}
                              {(() => {
                                const trainingServices = provider.services.filter(s => s.categoryName === 'Training');
                                const displayService = trainingServices.length > 0 ? trainingServices.sort((a, b) => Number(b.price) - Number(a.price))[0] : provider.services[0];
                                return (
                                  <p className="text-sm font-medium text-blue-600">
                                    {displayService.name} - R{displayService.price}
                                    {displayService.durationMinutes ? `/${displayService.durationMinutes}min` : '/hour'}
                                  </p>
                                );
                              })()}
                              {provider.services.length > 1 && (
                                <p className="text-xs text-gray-500">+{provider.services.length - 1} more services</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {provider.services && provider.services.length > 0 
                              ? (() => {
                                  const trainingServices = provider.services.filter(s => s.categoryName === 'Training');
                                  const displayService = trainingServices.length > 0 ? trainingServices.sort((a, b) => Number(b.price) - Number(a.price))[0] : provider.services[0];
                                  return `R${displayService.price}`;
                                })()
                              : 'Contact for rates'}
                          </div>
                          <Button 
                            className="mt-2"
                            onClick={() => {
                              console.log('Selected provider data:', provider);
                              setSelectedProvider(provider);
                              setCurrentStep(5);
                            }}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: View Provider Profile */}
        {currentStep === 5 && selectedProvider && (
          <Card>
            <CardHeader>
              <CardTitle>Provider Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProvider.businessName}</h2>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedProvider.coveredSuburbs?.join(', ') || 'Multiple areas'}
                  </div>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{selectedProvider.rating} ({selectedProvider.totalReviews} reviews)</span>
                  </div>
                  {selectedProvider.isVerified && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      ✓ Verified Provider
                    </Badge>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-gray-600">{selectedProvider.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Services & Pricing</h3>
                  {selectedProvider.services && selectedProvider.services.length > 0 ? (
                    <div className="space-y-2">
                      {/* Sort services by price descending to show highest rates first */}
                      {selectedProvider.services
                        .sort((a, b) => Number(b.price) - Number(a.price))
                        .map((service) => (
                        <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-blue-600">
                              R{service.price}
                              {service.durationMinutes ? `/${service.durationMinutes}min` : '/hour'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Contact provider for rates</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Availability</h3>
                  <p className="text-gray-600">Available 7 days a week</p>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Providers
                </Button>
                <Button onClick={() => setCurrentStep(6)}>
                  Book This Provider
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Select Time Slot or Date Range */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Choose Date</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Choose Time</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTimeSlot === time ? "default" : "outline"}
                        onClick={() => setSelectedTimeSlot(time)}
                        className="text-sm"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(7)}
                  disabled={!selectedDate || !selectedTimeSlot}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Enter Pet Details */}
        {currentStep === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Pet Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Special instructions or requirements for your pets
                  </label>
                  <Textarea
                    value={petDetails}
                    onChange={(e) => setPetDetails(e.target.value)}
                    placeholder="e.g., Max is nervous around other dogs, Luna needs medication at 2pm, etc."
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(6)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(8)}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 8: Add Notes for Provider */}
        {currentStep === 8 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Notes for Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional notes or requests for the service provider
                  </label>
                  <Textarea
                    value={providerNotes}
                    onChange={(e) => setProviderNotes(e.target.value)}
                    placeholder="e.g., Please text when you arrive, use the side gate, emergency contact details, etc."
                    rows={4}
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h3 className="font-semibold mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div>Service: {serviceTypes.find(s => s.id === selectedService)?.name}</div>
                    {selectedSubOption && <div>Option: {selectedSubOption}</div>}
                    {selectedSuburb && <div>Location: {selectedSuburb}</div>}
                    <div>Provider: {selectedProvider?.businessName}</div>
                    <div>Date: {selectedDate ? format(selectedDate, "PPP") : ""}</div>
                    <div>Time: {selectedTimeSlot}</div>
                    <div>Dogs: {selectedDogs.map(id => dogs.find(d => d.id === id)?.name).join(", ")}</div>
                    <div className="font-semibold pt-2 border-t">
                      Estimated Cost: {(() => {
                        if (selectedProvider?.services && selectedProvider.services.length > 0) {
                          const trainingServices = selectedProvider.services.filter(s => s.categoryName === 'Training');
                          const displayService = trainingServices.length > 0 ? trainingServices.sort((a, b) => Number(b.price) - Number(a.price))[0] : selectedProvider.services[0];
                          return `R${displayService.price}${displayService.durationMinutes ? `/${displayService.durationMinutes}min` : '/hour'}`;
                        }
                        return 'Contact for rates';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(7)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleBookingSubmit} className="bg-doglife-primary">
                  Confirm & Pay
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}