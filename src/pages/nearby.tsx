import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, Star, Phone, Globe, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NearbySupplier {
  id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  websiteUrl?: string;
  logoUrl?: string;
  operatingSuburb: string;
  suburbCity: string;
  suburbProvince: string;
  services: Array<{
    id: string;
    service: string;
    baseRateCents: number;
    unit: string;
    durationMinutes: number;
    isActive: boolean;
  }>;
}

interface NearbyResponse {
  userAddress: {
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  searchedSuburb: {
    id?: string;
    name: string;
    found: boolean;
  };
  suppliers: NearbySupplier[];
  total: number;
  message?: string;
}

function SupplierCard({ supplier }: { supplier: NearbySupplier }) {
  const navigate = useNavigate();

  const formatPrice = (cents: number) => {
    return `R${(cents / 100).toFixed(0)}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const handleBookService = () => {
    navigate(`/booking/provider/${supplier.id}`);
  };

  const handleViewWebsite = () => {
    if (supplier.websiteUrl) {
      window.open(supplier.websiteUrl.startsWith('http') ? supplier.websiteUrl : `https://${supplier.websiteUrl}`, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200" data-testid={`supplier-card-${supplier.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={supplier.logoUrl} />
              <AvatarFallback className="bg-doglife-primary text-white">
                {supplier.businessName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg text-doglife-dark" data-testid={`business-name-${supplier.id}`}>
                {supplier.businessName}
              </h3>
              <div className="flex items-center space-x-1 mt-1 text-sm text-doglife-neutral">
                <MapPin className="h-3 w-3" />
                <span data-testid={`location-${supplier.id}`}>
                  {supplier.operatingSuburb}, {supplier.suburbCity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Services */}
        {supplier.services && supplier.services.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-doglife-dark mb-2">Services Offered</h4>
            <div className="space-y-2">
              {supplier.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2" data-testid={`service-${service.id}`}>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{service.service}</span>
                    {service.durationMinutes > 0 && (
                      <div className="flex items-center text-xs text-doglife-neutral mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(service.durationMinutes)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-doglife-primary">
                      {formatPrice(service.baseRateCents)}
                    </span>
                    {service.unit && (
                      <span className="text-xs text-doglife-neutral">/{service.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleBookService}
            className="flex-1 bg-doglife-primary hover:bg-doglife-primary/90"
            data-testid={`button-book-${supplier.id}`}
          >
            Book Service
          </Button>
          {supplier.websiteUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewWebsite}
              data-testid={`button-website-${supplier.id}`}
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function NearbyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<NearbyResponse>({
    queryKey: ["/api/suppliers/nearby"],
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        
        <div className="container mx-auto max-w-4xl p-6">
          <div className="text-center py-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto max-w-4xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-doglife-dark mb-2" data-testid="page-title">
            Nearby Service Providers
          </h1>
          <p className="text-doglife-neutral">
            Find pet service providers in your area
          </p>
        </div>

        {/* User Address Info */}
        {data?.userAddress && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Your saved address:</span>
                <span className="text-blue-700" data-testid="user-address">
                  {[data.userAddress.street, data.userAddress.suburb, data.userAddress.city]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" data-testid="error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load nearby service providers. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* No Address Saved */}
        {data?.message && data.suppliers.length === 0 && (
          <Alert data-testid="no-address-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {data.message}
              <div className="mt-2">
                <Button 
                  onClick={() => navigate('/service-flow')}
                  size="sm"
                  data-testid="button-add-address"
                >
                  Add Your Address
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* No Providers Found */}
        {data && !data.message && data.suppliers.length === 0 && data.searchedSuburb && (
          <Alert data-testid="no-providers-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {data.searchedSuburb.found 
                ? `No service providers found operating in ${data.searchedSuburb.name}. Try browsing all providers or contact us to add providers in your area.`
                : `We couldn't find ${data.searchedSuburb.name} in our service areas. We're working to expand to more areas soon!`
              }
              <div className="mt-2 space-x-2">
                <Button 
                  onClick={() => navigate('/suppliers')}
                  variant="outline"
                  size="sm"
                  data-testid="button-browse-all"
                >
                  Browse All Providers
                </Button>
                <Button 
                  onClick={() => navigate('/prospect-enquiry')}
                  size="sm"
                  data-testid="button-request-expansion"
                >
                  Request Service in Your Area
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Providers List */}
        {data && data.suppliers.length > 0 && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div data-testid="results-count">
                <span className="text-lg font-semibold text-doglife-dark">
                  {data.total} provider{data.total !== 1 ? 's' : ''} found
                </span>
                {data.searchedSuburb && (
                  <span className="text-sm text-doglife-neutral ml-2">
                    in {data.searchedSuburb.name}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/suppliers')}
                data-testid="button-view-all"
              >
                View All Providers
              </Button>
            </div>

            {/* Providers Grid */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {data.suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}