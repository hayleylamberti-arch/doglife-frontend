import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Shield, Phone, Mail, Calendar, ArrowLeft, Clock, Users, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: provider, isLoading, error } = useQuery({
    queryKey: [`/api/providers/${id}`],
    enabled: !!id,
  });

  const { data: employees = [] } = useQuery({
    queryKey: [`/api/employees/${id}`],
    enabled: !!id,
  });

  const { data: services = [] } = useQuery({
    queryKey: [`/api/services/provider/${id}`],
    enabled: !!id,
  });

  const contactProviderMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return await apiRequest("/api/conversations", "POST", { otherUserId });
    },
    onSuccess: () => {
      toast({
        title: "Conversation started",
        description: "You can now message this provider",
      });
      navigate("/messages");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContactProvider = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to contact providers",
        variant: "destructive",
      });
      return;
    }

    if (provider?.user?.id) {
      contactProviderMutation.mutate(provider.user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-doglife-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-doglife-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold text-doglife-dark mb-4">Provider Not Found</h1>
              <p className="text-doglife-neutral mb-6">
                The provider you're looking for doesn't exist or is no longer available.
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

  const getInitials = () => {
    const firstName = provider.user?.firstName || "";
    const lastName = provider.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";
  };

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/providers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Providers
          </Link>
        </Button>

        {/* Provider Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={provider.user?.profileImageUrl} />
                  <AvatarFallback className="bg-doglife-primary text-white text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-doglife-dark">
                      {provider.businessName}
                    </h1>
                    {provider.isVerified && (
                      <Badge variant="secondary" className="text-green-700 bg-green-50">
                        <Shield className="h-4 w-4 mr-1" />
                        Verified Provider
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-doglife-neutral">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-lg">{provider.rating}</span>
                      <span>({provider.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Professional Service Provider</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleContactProvider}
                  disabled={contactProviderMutation.isPending || !user || user.id === provider.user?.id}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {contactProviderMutation.isPending ? "Starting..." : "Contact Provider"}
                </Button>
                <Button size="lg" asChild>
                  <Link href={`/booking/provider/${provider.id}`}>
                    Book Service
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800 font-medium">Available</div>
                <div className="text-xs text-blue-700">7 Days a Week</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-sm text-green-800 font-medium">Response Time</div>
                <div className="text-xs text-green-700">Within 2 hours</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About {provider.businessName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-doglife-neutral leading-relaxed">
                  {provider.description}
                </p>
              </CardContent>
            </Card>

            {/* Services Offered */}
            {provider.servicesOffered && provider.servicesOffered.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {provider.servicesOffered.map((service: string, index: number) => (
                      <Badge key={index} variant="default" className="bg-blue-100 text-blue-800 py-2 px-3 justify-center">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Qualifications */}
            {provider.qualifications && provider.qualifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Qualifications & Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(Array.isArray(provider.qualifications) 
                      ? provider.qualifications 
                      : provider.qualifications.split(',')
                    ).map((qual: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 py-2 px-3 block w-fit">
                        {qual.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.businessRegistration && (
                  <div>
                    <h4 className="font-medium text-sm text-doglife-dark mb-1">Business Registration</h4>
                    <p className="text-sm text-doglife-neutral">{provider.businessRegistration}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-doglife-dark mb-1">Background Check Status</h4>
                  <Badge variant={provider.isBackgroundChecked ? "default" : "secondary"} 
                         className={provider.isBackgroundChecked ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {provider.isBackgroundChecked ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-doglife-dark mb-1">Verification Status</h4>
                  <Badge variant={provider.isVerified ? "default" : "secondary"} 
                         className={provider.isVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {provider.isVerified ? "Verified Provider" : "Unverified"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Team Setup */}
            {employees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employees.map((employee: any) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm text-doglife-dark">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p className="text-xs text-doglife-neutral">{employee.position}</p>
                        </div>
                        <Badge variant={employee.isActive ? "default" : "secondary"} 
                               className={employee.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services & Pricing */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services & Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service: any) => (
                      <div key={service.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-doglife-dark">{service.name}</h4>
                          <div className="text-right">
                            <div className="text-lg font-bold text-doglife-primary">R{parseFloat(service.price).toFixed(2)}</div>
                            {service.duration && (
                              <div className="text-sm text-doglife-neutral">{service.duration} min</div>
                            )}
                          </div>
                        </div>
                        {service.description && (
                          <p className="text-sm text-doglife-neutral">{service.description}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant={service.isActive ? "default" : "secondary"} 
                                 className={service.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {service.isActive ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Service Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {provider.coveredSuburbs?.map((suburb: string, index: number) => (
                    <Badge key={index} variant="outline" className="block w-fit">
                      {suburb}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Business Hours & Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-doglife-dark">Monday</div>
                    <div className="text-doglife-neutral">8:00 AM - 6:00 PM</div>
                    <div className="font-medium text-doglife-dark">Tuesday</div>
                    <div className="text-doglife-neutral">8:00 AM - 6:00 PM</div>
                    <div className="font-medium text-doglife-dark">Wednesday</div>
                    <div className="text-doglife-neutral">8:00 AM - 6:00 PM</div>
                    <div className="font-medium text-doglife-dark">Thursday</div>
                    <div className="text-doglife-neutral">8:00 AM - 6:00 PM</div>
                    <div className="font-medium text-doglife-dark">Friday</div>
                    <div className="text-doglife-neutral">8:00 AM - 6:00 PM</div>
                    <div className="font-medium text-doglife-dark">Saturday</div>
                    <div className="text-doglife-neutral">9:00 AM - 4:00 PM</div>
                    <div className="font-medium text-doglife-dark">Sunday</div>
                    <div className="text-doglife-neutral">Closed</div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Currently Open</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-doglife-neutral" />
                  <span className="text-sm text-doglife-neutral">Available via booking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-doglife-neutral" />
                  <span className="text-sm text-doglife-neutral">Message through platform</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Payment & Membership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg mb-3">
                  <div className="flex items-center text-sm text-blue-800 mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-medium">Direct payment to provider</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Pay securely directly to the service provider for each service
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-purple-800 mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">DogLife Annual Membership</span>
                  </div>
                  <p className="text-xs text-purple-700">
                    Both owners and providers require annual membership for platform access
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}