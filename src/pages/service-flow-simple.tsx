import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

const serviceTypes = [
  { id: 1, name: "Dog Training", icon: "🎓", hasLocation: true, options: [] },
  { id: 2, name: "Dog Walking", icon: "🚶", hasLocation: true, options: [] },
  { id: 3, name: "Dog Grooming", icon: "✂️", hasLocation: false, options: ["Mobile", "Grooming Parlour"], groomingTypes: ["Wash & Brush", "Full Grooming", "Nail Trim Only"] },
  { id: 4, name: "Dog Boarding", icon: "🏠", hasLocation: true, options: [] },
  { id: 5, name: "Doggy Daycare", icon: "🎾", hasLocation: true, options: ["Full Day", "Half Day"], supportsMultiDay: true },
  { id: 6, name: "Pet Sitting", icon: "👥", hasLocation: false, options: ["Full Day", "Overnight"] },
  { id: 7, name: "Pet Transport", icon: "🚗", hasLocation: false, options: ["At My Home", "At Provider's Location"] },
  { id: 8, name: "Vet", icon: "🩺", hasLocation: true, options: ["Mobile Vet", "Veterinary Practice"] },
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

export default function ServiceFlowSimple() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedGroomingType, setSelectedGroomingType] = useState<string>("");
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [selectedDogs, setSelectedDogs] = useState<number[]>([]);
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [departureDate, setDepartureDate] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dogSocialInfo, setDogSocialInfo] = useState<{[dogId: number]: boolean}>({});
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState({
    date: "",
    time: "",
    petDetails: "",
    notes: ""
  });

  // Get current service type
  const currentServiceType = serviceTypes.find(s => s.id === selectedService);

  // Fetch user's dogs
  const { data: dogs = [] } = useQuery<any[]>({
    queryKey: ["/api/dogs"],
    enabled: isAuthenticated,
  });

  // Fetch real providers based on selected service
  const serviceTypeName = currentServiceType?.name;
  const { data: providersResponse = { suppliers: [] } } = useQuery<{ suppliers: any[] }>({
    queryKey: ["/api/public/suppliers", serviceTypeName, selectedSuburb, selectedOption, selectedGroomingType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceTypeName) params.append('service', serviceTypeName);
      if (selectedSuburb) params.append('suburb', selectedSuburb);
      
      const response = await fetch(`/api/public/suppliers?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Frontend received supplier data from Zoho:', data);
      return data;
    },
    enabled: !!selectedService && (currentStep === 5),
  });

  // Map Zoho supplier data to provider format for compatibility
  const providers = providersResponse.suppliers.map((supplier: any) => ({
    id: supplier.id || 'unknown',
    name: supplier.businessName || 'Unnamed Business',
    businessName: supplier.businessName || 'Unnamed Business',
    businessDescription: supplier.description || '',
    description: supplier.description || '',
    service: serviceTypeName || '',
    services: supplier.services || [serviceTypeName || ''],
    rate: supplier.rates?.find((r: any) => r.service === serviceTypeName)?.price || 0,
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
    const service = serviceTypes.find(s => s.id === serviceId);
    
    if (service?.options && service.options.length > 0) {
      setCurrentStep(2); // Go to options
    } else if (service?.hasLocation) {
      setCurrentStep(3); // Go to location
    } else {
      setCurrentStep(4); // Go to dogs
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    
    // Special logic for Dog Grooming - go to grooming type selection
    if (currentServiceType?.name === "Dog Grooming") {
      setCurrentStep(2.5); // Go to grooming type selection
    } else if (currentServiceType?.hasLocation) {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  };

  const handleGroomingTypeSelect = (groomingType: string) => {
    setSelectedGroomingType(groomingType);
    setCurrentStep(4); // Go to dog selection
  };

  const handleSuburbSelect = (suburb: string) => {
    setSelectedSuburb(suburb);
    setCurrentStep(4);
  };

  const handleDogToggle = (dogId: number) => {
    setSelectedDogs(prev => 
      prev.includes(dogId) 
        ? prev.filter(id => id !== dogId)
        : [...prev, dogId]
    );
  };

  const handleSocialToggle = (dogId: number, isSocial: boolean) => {
    setDogSocialInfo(prev => ({
      ...prev,
      [dogId]: isSocial
    }));
  };

  const isServiceWithDates = () => {
    return currentServiceType?.name === "Dog Boarding" || currentServiceType?.name === "Pet Sitting";
  };

  const handleProviderSelect = async (provider: any) => {
    setSelectedProvider(provider);
    // Skip step 6 for boarding/pet sitting since dates are already collected
    if (isServiceWithDates()) {
      // Directly submit booking for boarding/pet sitting
      await handleBookingSubmitDirect(provider);
    } else {
      setCurrentStep(6);
    }
  };

  const handleBookingSubmitDirect = async (provider: any) => {
    const bookingData = {
      serviceId: selectedService,
      serviceOption: selectedOption,
      groomingType: selectedGroomingType,
      suburb: selectedSuburb,
      providerId: provider.id,
      dogIds: selectedDogs,
      // For boarding/pet sitting, use arrivalDate as scheduledDate and add departureDate
      scheduledDate: isServiceWithDates() ? arrivalDate : undefined,
      scheduledTime: isServiceWithDates() ? "09:00" : undefined, // Default check-in time
      departureDate: isServiceWithDates() ? departureDate : undefined,
      dogSocialInfo: isServiceWithDates() ? dogSocialInfo : undefined,
      numberOfDogs: selectedDogs.length,
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        toast({
          title: "Booking Successful!",
          description: "Your booking request has been sent to the provider.",
        });
        // Reset form and go back to step 1
        setCurrentStep(1);
        setSelectedService(null);
        setSelectedOption("");
        setSelectedGroomingType("");
        setSelectedSuburb("");
        setSelectedDogs([]);
        setArrivalDate("");
        setDepartureDate("");
        setDogSocialInfo({});
        setSelectedProvider(null);
      } else {
        const errorData = await response.json();
        toast({
          title: "Booking Failed",
          description: errorData.message || "Failed to submit booking",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while submitting your booking",
        variant: "destructive",
      });
    }
  };

  const handleBookingSubmit = async () => {
    try {
      // Find the correct service ID from the selected provider's services
      let actualServiceId = selectedService;
      
      if (selectedProvider?.services && currentServiceType) {
        // For Doggy Daycare, find a service that matches the selected slot
        if (currentServiceType.name === "Doggy Daycare" && bookingDetails.time) {
          const slotService = selectedProvider.services.find((service: any) => 
            service.categoryName === "Daycare" && 
            service.name.includes(bookingDetails.time)
          );
          
          if (slotService) {
            actualServiceId = slotService.id;
          } else {
            // Fallback to first daycare service if no slot match
            const daycareService = selectedProvider.services.find((service: any) => 
              service.categoryName === "Daycare"
            );
            if (daycareService) {
              actualServiceId = daycareService.id;
            }
          }
        } else {
          // For other services, find by category name matching service type
          let matchingService = selectedProvider.services.find((service: any) => 
            service.categoryName === currentServiceType.name ||
            service.name.toLowerCase().includes(currentServiceType.name.toLowerCase())
          );
          
          // Special handling for Pet Transport
          if (!matchingService && currentServiceType.name === "Pet Transport") {
            // Try to match by service option first
            if (selectedOption) {
              matchingService = selectedProvider.services.find((service: any) => 
                service.categoryName === "Transport" &&
                service.name.toLowerCase().includes(selectedOption.toLowerCase())
              );
            }
            
            // Fallback to any transport service
            if (!matchingService) {
              matchingService = selectedProvider.services.find((service: any) => 
                service.categoryName === "Transport" ||
                service.name.toLowerCase().includes("transport")
              );
            }
          }
          
          // Special handling for Vet services
          if (!matchingService && currentServiceType.name === "Vet") {
            // Try to match by service option first
            if (selectedOption) {
              matchingService = selectedProvider.services.find((service: any) => 
                service.categoryName === "Vet" &&
                service.name.toLowerCase().includes(selectedOption.toLowerCase())
              );
            }
            
            // Fallback to any vet service
            if (!matchingService) {
              matchingService = selectedProvider.services.find((service: any) => 
                service.categoryName === "Vet" ||
                service.name.toLowerCase().includes("vet")
              );
            }
          }
          
          if (matchingService) {
            actualServiceId = matchingService.id;
          }
        }
      }
      
      // Handle multi-day Doggy Daycare bookings
      if (currentServiceType?.supportsMultiDay && selectedDates.length > 0) {
        const bookingPromises = selectedDates.map(date => {
          const [dateStr] = date.split('T');
          
          // Map daycare slots to actual start times
          let startTime = "08:00";
          if (bookingDetails.time === "Morning") {
            startTime = "08:00";
          } else if (bookingDetails.time === "Afternoon") {
            startTime = "12:00";
          } else if (bookingDetails.time === "Full Day") {
            startTime = "08:00";
          } else {
            // For backward compatibility with specific times
            startTime = bookingDetails.time;
          }
          
          const scheduledDateTime = `${dateStr}T${startTime}:00.000Z`;
          
          const bookingData = {
            serviceId: actualServiceId,
            serviceOption: selectedOption,
            suburb: selectedSuburb,
            providerId: selectedProvider?.id,
            dogIds: selectedDogs,
            date: dateStr,
            time: bookingDetails.time,
            scheduledDate: scheduledDateTime,
            petDetails: bookingDetails.petDetails,
            notes: bookingDetails.notes
          };
          
          return fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(bookingData),
          });
        });

        const responses = await Promise.all(bookingPromises);
        const allSuccessful = responses.every(response => response.ok);
        
        if (allSuccessful) {
          toast({
            title: "Bookings Successful!",
            description: `${selectedDates.length} day booking requests sent to the provider.`,
          });
          navigate("/dashboard");
        } else {
          toast({
            title: "Some Bookings Failed",
            description: "Please check your bookings and try again.",
            variant: "destructive",
          });
        }
      } else {
        // Handle single-day bookings
        let processedBookingDetails = { ...bookingDetails };
        
        // Map daycare slots to actual times for single-day bookings too
        if (currentServiceType?.name === "Doggy Daycare" && bookingDetails.time) {
          let startTime = "08:00";
          if (bookingDetails.time === "Morning") {
            startTime = "08:00";
          } else if (bookingDetails.time === "Afternoon") {
            startTime = "12:00";
          } else if (bookingDetails.time === "Full Day") {
            startTime = "08:00";
          } else {
            // For backward compatibility with specific times
            startTime = bookingDetails.time;
          }
          processedBookingDetails.time = startTime;
        }
        
        const bookingData = {
          serviceId: actualServiceId,
          serviceOption: selectedOption,
          groomingType: selectedGroomingType,
          suburb: selectedSuburb,
          providerId: selectedProvider?.id,
          dogIds: selectedDogs,
          arrivalDate: isServiceWithDates() ? arrivalDate : undefined,
          departureDate: isServiceWithDates() ? departureDate : undefined,
          dogSocialInfo: isServiceWithDates() ? dogSocialInfo : undefined,
          // For services that need scheduled date/time (like Pet Transport)
          scheduledDate: processedBookingDetails.date || new Date().toISOString().split('T')[0],
          scheduledTime: processedBookingDetails.time || "10:00",
          ...processedBookingDetails
        };

        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(bookingData),
        });

        if (response.ok) {
          toast({
            title: "Booking Successful!",
            description: "Your booking request has been sent to the provider.",
          });
          navigate("/dashboard");
        } else {
          const errorData = await response.json();
          toast({
            title: "Booking Failed",
            description: errorData.message || "Failed to submit booking",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Booking failed:", error);
      toast({
        title: "Error",
        description: "An error occurred while submitting your booking",
        variant: "destructive",
      });
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
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
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
            Step {currentStep} of 7
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
                    className="cursor-pointer hover:shadow-lg transition-all"
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

        {/* Step 2: Select Service Options */}
        {currentStep === 2 && currentServiceType?.options && currentServiceType.options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Service Option</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentServiceType?.options?.map((option) => (
                  <Card
                    key={option}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => handleOptionSelect(option)}
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

        {/* Step 2.5: Select Grooming Type */}
        {currentStep === 2.5 && currentServiceType?.name === "Dog Grooming" && (
          <Card>
            <CardHeader>
              <CardTitle>Select Grooming Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentServiceType.groomingTypes?.map((groomingType) => (
                  <Card
                    key={groomingType}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => handleGroomingTypeSelect(groomingType)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="font-medium">{groomingType}</div>
                      <div className="text-sm text-gray-600 mt-2">
                        {groomingType === "Wash & Brush" && "Basic wash and brush out"}
                        {groomingType === "Full Grooming" && "Complete grooming service including wash, cut, and style"}
                        {groomingType === "Nail Trim Only" && "Just nail trimming service"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Location */}
        {currentStep === 3 && currentServiceType?.hasLocation && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Suburb</CardTitle>
            </CardHeader>
            <CardContent>
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
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(currentServiceType?.options.length > 0 ? 2 : 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Select Dogs */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Dogs</CardTitle>
            </CardHeader>
            <CardContent>
              {isServiceWithDates() && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-4">Select Dates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Arrival Date</label>
                      <input
                        type="date"
                        value={arrivalDate}
                        onChange={(e) => setArrivalDate(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Departure Date</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        min={arrivalDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {dogs.map((dog: any) => (
                  <div key={dog.id} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Checkbox
                        checked={selectedDogs.includes(dog.id)}
                        onCheckedChange={() => handleDogToggle(dog.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{dog.name}</div>
                        <div className="text-sm text-gray-600">
                          {dog.breed} • {dog.age} years old
                        </div>
                      </div>
                    </div>
                    
                    {isServiceWithDates() && selectedDogs.includes(dog.id) && (
                      <div className="ml-8 mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Is {dog.name} social with other dogs?</div>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`social-${dog.id}`}
                              checked={dogSocialInfo[dog.id] === true}
                              onChange={() => handleSocialToggle(dog.id, true)}
                              className="mr-2"
                            />
                            Yes, social
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`social-${dog.id}`}
                              checked={dogSocialInfo[dog.id] === false}
                              onChange={() => handleSocialToggle(dog.id, false)}
                              className="mr-2"
                            />
                            No, needs isolation
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => {
                  // Back navigation logic for Dog Grooming with grooming types
                  if (currentServiceType?.name === "Dog Grooming") {
                    setCurrentStep(2.5); // Back to grooming type selection
                  } else if (currentServiceType?.options && currentServiceType.options.length > 0) {
                    setCurrentStep(2); // Back to options
                  } else {
                    setCurrentStep(1); // Back to service selection
                  }
                }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(5)}
                  disabled={
                    selectedDogs.length === 0 || 
                    (isServiceWithDates() && (!arrivalDate || !departureDate)) ||
                    (isServiceWithDates() && selectedDogs.some(dogId => dogSocialInfo[dogId] === undefined))
                  }
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Browse Providers */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Browse Providers</CardTitle>
            </CardHeader>
            <CardContent>
              {isServiceWithDates() && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-3">Booking Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Arrival:</span> {new Date(arrivalDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Departure:</span> {new Date(departureDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium">Selected Dogs:</span>
                    <div className="mt-2 space-y-1">
                      {selectedDogs.map(dogId => {
                        const dog = dogs.find((d: any) => d.id === dogId);
                        return (
                          <div key={dogId} className="text-sm flex justify-between">
                            <span>{dog?.name}</span>
                            <span className={dogSocialInfo[dogId] ? "text-green-600" : "text-orange-600"}>
                              {dogSocialInfo[dogId] ? "Social" : "Needs isolation"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {providers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No providers found for this service. Please try a different location or service type.
                  </div>
                )}
                {providers.map((provider: any) => (
                  <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{provider.businessName}</h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {provider.coveredSuburbs?.[0] || selectedSuburb || "Available in your area"}
                          </div>
                          <div className="flex items-center mt-2">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm">{provider.rating || 0} ({provider.totalReviews || 0} reviews)</span>
                          </div>
                          <p className="text-gray-600 mt-2">{provider.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">Contact for rates</div>
                          <Button 
                            className="mt-2"
                            onClick={() => handleProviderSelect(provider)}
                          >
                            Select Provider
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Select Date & Time */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {currentServiceType?.supportsMultiDay ? "Select Dates & Time" : "Select Date & Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentServiceType?.supportsMultiDay ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Dates for {currentServiceType.name}
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Choose multiple dates by clicking on each date you need service.
                    </p>
                    <div className="grid grid-cols-7 gap-2 p-4 border rounded-lg bg-gray-50">
                      {/* Generate next 30 days */}
                      {Array.from({ length: 30 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedDates.includes(dateStr);
                        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                        const dayNum = date.getDate();
                        
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDates(prev => prev.filter(d => d !== dateStr));
                              } else {
                                setSelectedDates(prev => [...prev, dateStr]);
                              }
                            }}
                            className={`p-2 text-xs rounded transition-colors ${
                              isSelected 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white hover:bg-blue-100 border'
                            }`}
                          >
                            <div className="font-medium">{dayName}</div>
                            <div>{dayNum}</div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedDates.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <div className="text-sm font-medium">Selected Dates:</div>
                        <div className="text-sm text-blue-700 mt-1">
                          {selectedDates.sort().map(date => new Date(date).toLocaleDateString()).join(', ')}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                          Total: {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={bookingDetails.date}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {currentServiceType?.name === "Doggy Daycare" ? "Daycare Slot" : currentServiceType?.supportsMultiDay ? "Daily Start Time" : "Time"}
                  </label>
                  <Select 
                    value={bookingDetails.time} 
                    onValueChange={(time) => setBookingDetails(prev => ({ ...prev, time }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={currentServiceType?.name === "Doggy Daycare" ? "Choose daycare slot" : "Choose time"} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentServiceType?.name === "Doggy Daycare" ? [
                        { value: "Morning", label: "Morning (8:00 AM - 12:00 PM)" },
                        { value: "Afternoon", label: "Afternoon (12:00 PM - 5:00 PM)" },
                        { value: "Full Day", label: "Full Day (8:00 AM - 5:00 PM)" }
                      ].map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          <Clock className="h-4 w-4 mr-2 inline" />
                          {slot.label}
                        </SelectItem>
                      )) : ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"].map((time) => (
                        <SelectItem key={time} value={time}>
                          <Clock className="h-4 w-4 mr-2 inline" />
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(7)}
                  disabled={
                    currentServiceType?.supportsMultiDay 
                      ? selectedDates.length === 0 || !bookingDetails.time
                      : !bookingDetails.date || !bookingDetails.time
                  }
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Add Details & Confirm */}
        {currentStep === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Details & Confirm Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pet Details</label>
                  <Textarea
                    value={bookingDetails.petDetails}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, petDetails: e.target.value }))}
                    placeholder="Special instructions for your pets..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes for Provider</label>
                  <Textarea
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or requests..."
                    rows={3}
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div>Service: {currentServiceType?.name}</div>
                    {selectedOption && <div>Option: {selectedOption}</div>}
                    {selectedSuburb && <div>Location: {selectedSuburb}</div>}
                    <div>Provider: {selectedProvider?.businessName}</div>
                    
                    {currentServiceType?.supportsMultiDay && selectedDates.length > 0 ? (
                      <div>
                        <div className="font-medium">Dates ({selectedDates.length} days):</div>
                        <div className="ml-2 mt-1 space-y-1">
                          {selectedDates.sort().map(date => (
                            <div key={date} className="text-xs">
                              • {new Date(date).toLocaleDateString('en', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>Date: {bookingDetails.date}</div>
                    )}
                    
                    <div>
                      {currentServiceType?.supportsMultiDay ? "Daily Start Time" : "Time"}: {bookingDetails.time}
                    </div>
                    <div>Dogs: {selectedDogs.map(id => dogs.find((d: any) => d.id === id)?.name).join(", ")}</div>
                    <div className="font-semibold pt-2 border-t">
                      {currentServiceType?.supportsMultiDay && selectedDates.length > 0 
                        ? `Total Days: ${selectedDates.length} • Contact provider for rates`
                        : "Contact provider for rates"
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(6)}>
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