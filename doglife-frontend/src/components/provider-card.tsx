import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Shield, Phone, Mail, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProviderCardProps {
  provider: {
    id: number;
    businessName: string;
    description: string;
    rating: string;
    totalReviews: number;
    coveredSuburbs: string[];
    isVerified: boolean;
    user: {
      profileImageUrl?: string;
      firstName?: string;
      lastName?: string;
    };
    services?: Array<{
      id: number;
      name: string;
      description: string;
      price: number;
      durationMinutes: number;
      categoryName: string;
    }>;
  };
  onSelect?: (providerId: number) => void;
}

export default function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/provider/${provider.id}`);
  };

  const handleBookService = () => {
    navigate(`/booking/provider/${provider.id}`);
  };

  const getInitials = () => {
    const firstName = provider.user.firstName || "";
    const lastName = provider.user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={provider.user.profileImageUrl} />
              <AvatarFallback className="bg-doglife-primary text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg text-doglife-dark">
                  {provider.businessName}
                </h3>
                {provider.isVerified && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-doglife-dark">
                  {provider.rating}
                </span>
                <span className="text-sm text-doglife-neutral">
                  ({provider.totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>
          {provider.isVerified && (
            <Badge variant="secondary" className="text-green-700 bg-green-50">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-doglife-neutral text-sm line-clamp-2">
          {provider.description}
        </p>
        
        {/* Covered Areas */}
        <div>
          <div className="flex items-center text-sm text-doglife-neutral mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            Service Areas
          </div>
          <div className="flex flex-wrap gap-1">
            {provider.coveredSuburbs.slice(0, 3).map((suburb, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {suburb}
              </Badge>
            ))}
            {provider.coveredSuburbs.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{provider.coveredSuburbs.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Services & Pricing */}
        {provider.services && provider.services.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-doglife-neutral mb-2">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Services & Rates
            </div>
            <div className="space-y-1">
              {provider.services.slice(0, 3).map((service, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-doglife-dark">{service.name}</span>
                  <span className="font-medium text-blue-600">
                    R{service.price}{service.durationMinutes ? `/${service.durationMinutes}min` : '/hour'}
                  </span>
                </div>
              ))}
              {provider.services.length > 3 && (
                <div className="text-xs text-doglife-neutral">
                  +{provider.services.length - 3} more services
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provider Info */}
        <div className="flex items-center justify-between text-sm text-doglife-neutral">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Available 7 days
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <Mail className="h-4 w-4" />
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="font-medium">Direct payment to provider</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Pay securely directly to the service provider - no platform fees
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleBookService}
          >
            Book Service
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}