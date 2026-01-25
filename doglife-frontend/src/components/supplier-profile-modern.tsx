import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Calendar,
  Award,
  Shield,
  MessageSquare,
} from "lucide-react";
import ServiceCard, { Service } from "./service-card";
import BookingForm from "./booking-form";
import { StarRatingDisplay } from "./mutual-rating";

interface Review {
  id: string;
  rating: number;
  review?: string;
  createdAt: string;
  owner?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface SupplierProfile {
  id: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  address?: string;
  city?: string;
  province?: string;
  serviceTypes?: string[];
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  yearsExperience?: number;
  badges?: { name: string; icon: string }[];
}

interface SupplierProfileModernProps {
  supplierId: string;
  onBookService?: (serviceId: string) => void;
}

export default function SupplierProfileModern({
  supplierId,
  onBookService,
}: SupplierProfileModernProps) {
  const [activeTab, setActiveTab] = useState("services");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();

  const { data: supplier, isLoading: supplierLoading } = useQuery<SupplierProfile>({
    queryKey: ["/api/providers", supplierId],
    enabled: !!supplierId,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/providers", supplierId, "services"],
    enabled: !!supplierId,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/providers", supplierId, "reviews"],
    enabled: !!supplierId,
  });

  if (supplierLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg" />
        <div className="h-32 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Supplier not found</p>
        </CardContent>
      </Card>
    );
  }

  const displayName = supplier.businessName || `${supplier.firstName} ${supplier.lastName}`;
  
  const getInitials = (): string => {
    if (supplier.businessName) {
      return supplier.businessName.charAt(0).toUpperCase();
    }
    const first = supplier.firstName?.charAt(0) || "";
    const last = supplier.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "S";
  };

  const handleBookService = (serviceId: string) => {
    if (onBookService) {
      onBookService(serviceId);
    } else {
      setSelectedServiceId(serviceId);
      setBookingDialogOpen(true);
    }
  };

  const getServiceTypeColor = (type: string): string => {
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
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={supplier.profileImageUrl} alt={displayName} />
              <AvatarFallback className="bg-[hsl(24,100%,95%)] text-[hsl(24,100%,40%)] text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    {supplier.verified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  {supplier.rating !== undefined && (
                    <div className="mt-1">
                      <StarRatingDisplay
                        rating={supplier.rating}
                        reviewCount={supplier.reviewCount}
                        size="md"
                      />
                    </div>
                  )}

                  {(supplier.city || supplier.province) && (
                    <p className="flex items-center text-gray-600 mt-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {[supplier.city, supplier.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Book with {displayName}</DialogTitle>
                    </DialogHeader>
                    <BookingForm
                      providerId={supplierId}
                      serviceId={selectedServiceId}
                      onSuccess={() => setBookingDialogOpen(false)}
                      onCancel={() => setBookingDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {supplier.bio && (
                <p className="text-gray-600">{supplier.bio}</p>
              )}

              {supplier.serviceTypes && supplier.serviceTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {supplier.serviceTypes.map((type) => (
                    <Badge
                      key={type}
                      className={getServiceTypeColor(type)}
                      variant="secondary"
                    >
                      {type.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {supplier.rating?.toFixed(1) || "N/A"}
            </p>
            <p className="text-sm text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 text-[hsl(24,100%,50%)] mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {supplier.reviewCount || 0}
            </p>
            <p className="text-sm text-gray-500">Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {supplier.yearsExperience || 1}+
            </p>
            <p className="text-sm text-gray-500">Years Exp.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {supplier.verified ? "Yes" : "Pending"}
            </p>
            <p className="text-sm text-gray-500">Verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {supplier.badges && supplier.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-[hsl(24,100%,50%)]" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {supplier.badges.map((badge) => (
                <div
                  key={badge.name}
                  className="flex items-center space-x-2 bg-[hsl(24,100%,97%)] px-3 py-2 rounded-full"
                >
                  <span>{badge.icon}</span>
                  <span className="text-sm font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Services and Reviews */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="services" className="m-0">
              {services.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onBook={handleBookService}
                      showProvider={false}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No services listed yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="m-0">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.owner?.profileImageUrl} />
                          <AvatarFallback className="bg-gray-100">
                            {review.owner?.firstName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">
                              {review.owner?.firstName || "Anonymous"}
                            </p>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <StarRatingDisplay rating={review.rating} showCount={false} size="sm" />
                          {review.review && (
                            <p className="text-gray-600 mt-2">{review.review}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No reviews yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="contact" className="m-0">
              <div className="space-y-4">
                {supplier.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-[hsl(24,100%,50%)] hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a
                      href={`mailto:${supplier.email}`}
                      className="text-[hsl(24,100%,50%)] hover:underline"
                    >
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">{supplier.address}</span>
                  </div>
                )}
                {!supplier.phone && !supplier.email && !supplier.address && (
                  <p className="text-center text-gray-500 py-8">
                    No contact information available
                  </p>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
