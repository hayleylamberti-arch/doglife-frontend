import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  serviceType?: string;
  provider?: {
    id: string;
    businessName?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    rating?: number;
    reviewCount?: number;
    city?: string;
    province?: string;
  };
}

interface ServiceCardProps {
  service: Service;
  onBook?: (serviceId: string) => void;
  showProvider?: boolean;
  compact?: boolean;
}

export default function ServiceCard({
  service,
  onBook,
  showProvider = true,
  compact = false,
}: ServiceCardProps) {
  const formatPrice = (price?: number): string => {
    if (!price) return "Price on request";
    return `R${price.toFixed(2)}`;
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getProviderInitials = (): string => {
    if (service.provider?.businessName) {
      return service.provider.businessName.charAt(0).toUpperCase();
    }
    const first = service.provider?.firstName?.charAt(0) || "";
    const last = service.provider?.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "P";
  };

  const getServiceTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      WALKING: "bg-green-100 text-green-800",
      GROOMING: "bg-purple-100 text-purple-800",
      BOARDING: "bg-blue-100 text-blue-800",
      DAYCARE: "bg-yellow-100 text-yellow-800",
      TRAINING: "bg-orange-100 text-orange-800",
      PET_SITTING: "bg-pink-100 text-pink-800",
      PET_TRANSPORT: "bg-cyan-100 text-cyan-800",
      MOBILE_VET: "bg-red-100 text-red-800",
    };
    return colors[type || ""] || "bg-gray-100 text-gray-800";
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{service.name}</h3>
              {service.serviceType && (
                <Badge className={`${getServiceTypeColor(service.serviceType)} mt-1`} variant="secondary">
                  {service.serviceType.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-[hsl(24,100%,40%)]">{formatPrice(service.price)}</p>
              {service.duration && (
                <p className="text-xs text-gray-500 flex items-center justify-end">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(service.duration)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900">{service.name}</CardTitle>
            {service.serviceType && (
              <Badge className={`${getServiceTypeColor(service.serviceType)} mt-2`} variant="secondary">
                {service.serviceType.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[hsl(24,100%,40%)]">{formatPrice(service.price)}</p>
            {service.duration && (
              <p className="text-xs text-gray-500 flex items-center justify-end mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(service.duration)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {service.description && (
          <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
        )}

        {showProvider && service.provider && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={service.provider.profileImageUrl} />
                <AvatarFallback className="bg-[hsl(24,100%,95%)] text-[hsl(24,100%,40%)]">
                  {getProviderInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {service.provider.businessName || 
                   `${service.provider.firstName} ${service.provider.lastName}`}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {service.provider.rating !== undefined && (
                    <span className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      {service.provider.rating.toFixed(1)}
                      {service.provider.reviewCount !== undefined && (
                        <span className="ml-1">({service.provider.reviewCount})</span>
                      )}
                    </span>
                  )}
                  {service.provider.city && (
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {service.provider.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {onBook ? (
          <Button 
            onClick={() => onBook(service.id)}
            className="w-full bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
          >
            Book Now
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Link to={`/services/${service.id}`} className="w-full">
            <Button 
              variant="outline"
              className="w-full border-[hsl(24,100%,50%)] text-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,95%)]"
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
