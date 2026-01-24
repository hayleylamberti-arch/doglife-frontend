import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Star, Clock } from "lucide-react";

interface ServiceCardProps {
  service: {
    id: number;
    name: string;
    description: string;
    price: string;
    duration: number;
    provider: {
      id: number;
      businessName: string;
      rating: string;
      totalReviews: number;
      coveredSuburbs: string[];
      isVerified: boolean;
      user: {
        profileImageUrl?: string;
        firstName?: string;
      };
    };
    category: {
      name: string;
    };
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { user } = useAuth();
  const canBook = (user?.isSubscribed || false) && user?.userType !== 'provider';

  return (
    <Card className="hover:shadow-lg transition-shadow hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={service.provider.user.profileImageUrl || ""} />
            <AvatarFallback className="bg-doglife-primary text-white">
              {service.provider.businessName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-doglife-dark truncate">{service.name}</h3>
            <p className="text-sm text-doglife-neutral">{service.provider.businessName}</p>
            <div className="flex items-center mt-1">
              {service.provider.isVerified && (
                <Badge variant="secondary" className="mr-2 text-xs">
                  Verified
                </Badge>
              )}
              <div className="flex items-center text-sm text-doglife-neutral">
                <Star className="h-3 w-3 text-doglife-secondary mr-1 fill-current" />
                <span>{parseFloat(service.provider.rating).toFixed(1)}</span>
                <span className="ml-1">({service.provider.totalReviews})</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-doglife-neutral line-clamp-2">{service.description}</p>
          
          <div className="flex items-center text-sm text-doglife-neutral">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate">
              {service.provider.coveredSuburbs?.slice(0, 2).join(", ")}
              {service.provider.coveredSuburbs?.length > 2 && " +more"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-doglife-neutral">
              <div className="flex items-center">
                <span className="font-semibold text-doglife-dark">R{service.price}</span>
              </div>
              {service.duration && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{service.duration}min</span>
                </div>
              )}
            </div>
          </div>

          <Badge variant="outline" className="text-xs">
            {service.category.name}
          </Badge>

          <div className="pt-2">
            {canBook ? (
              <Button asChild className="w-full bg-doglife-primary hover:bg-blue-700">
                <Link href={`/booking/${service.id}`}>Book Now</Link>
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full">
                  {user?.userType === 'provider' ? 'Service Listing' : 'Subscription Required'}
                </Button>
                <p className="text-xs text-doglife-neutral text-center">
                  {user?.userType === 'provider' 
                    ? 'Connect with this provider as a potential client' 
                    : 'Upgrade to premium to book services'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
