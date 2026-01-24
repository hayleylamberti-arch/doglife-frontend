import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import BookingForm from "@/components/booking-form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Star, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function Booking() {
  const { serviceId, providerId } = useParams();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Check DogLife annual membership - temporarily disabled for testing
  // useEffect(() => {
  //   if (user && !user.isSubscribed) {
  //     toast({
  //       title: "DogLife Membership Required",
  //       description: "You need an annual DogLife membership to access services.",
  //       variant: "destructive",
  //     });
  //     navigate("/subscription");
  //     return;
  //   }
  // }, [user, setLocation, toast]);

  // Query for services based on whether we have a serviceId or providerId
  const { data: services, isLoading: serviceLoading, error } = useQuery({
    queryKey: serviceId ? [`/api/services/${serviceId}`] : [`/api/services/provider/${providerId}`],
    queryFn: async () => {
      if (serviceId) {
        // Direct service booking - find specific service
        const response = await fetch(`/api/services/search?limit=1000`);
        const allServices = await response.json();
        const service = allServices.find((s: any) => s.id === parseInt(serviceId!));
        return service ? [service] : [];
      } else if (providerId) {
        // Provider booking - get all services from this provider
        const response = await fetch(`/api/services/search?limit=1000`);
        const allServices = await response.json();
        return allServices.filter((s: any) => s.provider.id === parseInt(providerId!));
      }
      return [];
    },
    enabled: (!!serviceId || !!providerId) && !!user,
  });

  // For direct service booking, use the first (and only) service
  // For provider booking, use the selected service or null to show selection
  const service = serviceId ? services?.[0] : selectedService;

  const handleBookingSuccess = () => {
    navigate("/profile");
  };

  if (isLoading || serviceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-doglife-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (error || (serviceId && !service) || (providerId && (!services || services.length === 0))) {
    return (
      <div className="min-h-screen bg-doglife-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold text-doglife-dark mb-4">
                {serviceId ? "Service Not Found" : "No Services Available"}
              </h1>
              <p className="text-doglife-neutral mb-6">
                {serviceId 
                  ? "The service you're looking for doesn't exist or is no longer available."
                  : "This provider doesn't have any active services available for booking."
                }
              </p>
              <Button asChild>
                <Link href="/providers">Browse Providers</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/search">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-doglife-dark mb-2">
            {providerId && !selectedService ? "Select a Service" : "Book Service"}
          </h1>
          <p className="text-doglife-neutral">
            {providerId && services && services.length > 0 
              ? `Choose from ${services[0].provider.businessName}'s available services`
              : service && `Complete your booking with ${service.provider.businessName}`
            }
          </p>
        </div>

        {/* Service Selection for Provider Booking */}
        {providerId && !selectedService && services && services.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((svc: any) => (
                <Card key={svc.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-doglife-primary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{svc.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{svc.duration} minutes</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-doglife-primary" />
                          <span className="text-lg font-bold text-doglife-primary">R{svc.price}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{svc.description}</p>
                    <Button 
                      onClick={() => setSelectedService(svc)}
                      className="w-full"
                    >
                      Select This Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form - Show when we have a service selected */}
        {service && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              {selectedService && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedService(null)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Choose Different Service
                </Button>
              )}
              <BookingForm service={service} onSuccess={handleBookingSuccess} />
            </div>

          {/* Provider Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-doglife-dark">{service.provider.businessName}</h3>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-doglife-secondary mr-1 fill-current" />
                      <span className="text-sm">
                        {parseFloat(service.provider.rating).toFixed(1)} ({service.provider.totalReviews} reviews)
                      </span>
                      {service.provider.isVerified && (
                        <Shield className="h-4 w-4 text-doglife-accent ml-2" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-doglife-neutral mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-doglife-neutral">
                        <p className="font-medium">Service Areas:</p>
                        <p>{service.provider.coveredSuburbs?.slice(0, 3).join(", ")}</p>
                        {service.provider.coveredSuburbs?.length > 3 && (
                          <p className="text-xs">+{service.provider.coveredSuburbs.length - 3} more areas</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-doglife-neutral" />
                      <span className="text-sm text-doglife-neutral">
                        Typical response time: Within 2 hours
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-doglife-dark mb-2">What's Included:</h4>
                    <ul className="text-sm text-doglife-neutral space-y-1">
                      <li>• Professional service delivery</li>
                      <li>• Progress updates during service</li>
                      <li>• Post-service report</li>
                      <li>• 24/7 customer support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <h4 className="font-semibold text-blue-900">Payment & Membership</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <p className="text-blue-800 font-medium">
                      Service Payment: Direct to Provider
                    </p>
                    <p className="text-blue-700">
                      You pay {service.provider.businessName} directly for each service. Payment methods will be discussed after booking confirmation.
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded border-l-4 border-purple-500">
                    <p className="text-purple-800 font-medium">
                      DogLife Annual Membership
                    </p>
                    <p className="text-purple-700">
                      Both owners and providers pay annual membership to access the platform and connect with quality service providers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium text-doglife-dark mb-3">Need Help?</h4>
                <div className="space-y-2">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <Link href="/faq-owners">Booking FAQ</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <Link href="/about">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
