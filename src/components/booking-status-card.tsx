import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Check, X, AlertCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingCancellationDialog } from "./booking-cancellation-dialog";
import { MutualRating } from "./mutual-rating";

interface BookingStatusCardProps {
  booking: {
    id: string;
    scheduledDate: string;
    arrivalDate?: string;
    departureDate?: string;
    numberOfDogs?: number;
    kennelPreference?: string;
    status: string;
    totalAmount: string;
    notes?: string;
    declineReason?: string;
    providerResponse?: string;
    respondedAt?: string;
    service: {
      name: string;
      duration: number;
    };
    provider: {
      businessName: string;
      user?: {
        firstName: string;
        lastName: string;
      };
    };
    dog: {
      name: string;
      breed: string;
    };
  };
}

export function BookingStatusCard({ booking }: BookingStatusCardProps) {
  const [cancellationDialog, setCancellationDialog] = useState<{ isOpen: boolean; booking: any | null }>({
    isOpen: false,
    booking: null,
  });

  const handleBookingCancellation = () => {
    setCancellationDialog({ isOpen: true, booking });
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Your booking has been confirmed! The provider will contact you with any additional details.';
      case 'declined':
        return 'Unfortunately, this booking was declined by the provider. You can try booking with another provider or a different time.';
      case 'pending':
        return 'Your booking request is pending. The provider will respond soon.';
      case 'completed':
        return 'This service has been completed. Thank you for using our platform!';
      case 'cancelled':
        return 'This booking was cancelled.';
      default:
        return '';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      booking.status === 'accepted' && "border-green-200 dark:border-green-800",
      booking.status === 'declined' && "border-red-200 dark:border-red-800",
      booking.status === 'pending' && "border-yellow-200 dark:border-yellow-800"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{booking.service.name}</h3>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600">{booking.provider.businessName}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(booking.status)}
            <Badge className={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(booking.scheduledDate), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(booking.scheduledDate), 'HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{booking.dog.name} ({booking.dog.breed})</span>
          </div>
          <div className="text-green-600 font-medium">
            R{parseFloat(booking.totalAmount).toFixed(2)}
          </div>
        </div>

        {/* Boarding/Pet Sitting specific information */}
        {(booking.service.name.toLowerCase().includes('boarding') || 
          booking.service.name.toLowerCase().includes('sitting')) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2">
            <div className="font-medium text-blue-800 dark:text-blue-300 text-sm">Service Details</div>
            {booking.arrivalDate && booking.departureDate && (
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Calendar className="h-4 w-4" />
                  <span><strong>Check-in:</strong> {format(new Date(booking.arrivalDate), 'MMM d, yyyy')} at {format(new Date(booking.arrivalDate), 'HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Calendar className="h-4 w-4" />
                  <span><strong>Check-out:</strong> {format(new Date(booking.departureDate), 'MMM d, yyyy')} at {format(new Date(booking.departureDate), 'HH:mm')}</span>
                </div>
                <div className="text-blue-700 dark:text-blue-400">
                  <strong>Length of stay:</strong> {Math.ceil((new Date(booking.departureDate).getTime() - new Date(booking.arrivalDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            )}
            {booking.numberOfDogs && booking.numberOfDogs > 1 && (
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Number of dogs:</strong> {booking.numberOfDogs}
              </div>
            )}
            {booking.kennelPreference && booking.kennelPreference !== 'no_preference' && (
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Kennel preference:</strong> {
                  booking.kennelPreference === 'social' ? 'Social with other dogs' :
                  booking.kennelPreference === 'individual' ? 'Individual kennel required' :
                  'No preference'
                }
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        <div className={cn(
          "p-3 rounded-lg text-sm",
          booking.status === 'accepted' && "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300",
          booking.status === 'declined' && "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
          booking.status === 'pending' && "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
          (booking.status === 'completed' || booking.status === 'cancelled') && "bg-gray-50 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
        )}>
          {getStatusMessage(booking.status)}
        </div>

        {/* Decline Reason */}
        {booking.status === 'declined' && booking.declineReason && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              Reason for decline:
            </div>
            <div className="text-sm text-red-700 dark:text-red-400">
              {booking.declineReason}
            </div>
          </div>
        )}

        {/* Provider Response */}
        {booking.providerResponse && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              <MessageCircle className="h-4 w-4" />
              Message from provider:
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              {booking.providerResponse}
            </div>
          </div>
        )}

        {/* Booking Notes */}
        {booking.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <strong>Your notes:</strong> {booking.notes}
          </div>
        )}

        {/* Cancellation Actions */}
        {(booking.status === 'accepted' || booking.status === 'pending') && (
          <div className="pt-3 border-t">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBookingCancellation}
              className="w-full"
            >
              Cancel Booking
            </Button>
          </div>
        )}

        {/* Mutual Rating for Completed Bookings */}
        {booking.status === 'completed' && (
          <div className="pt-4 border-t">
            <MutualRating 
              bookingId={booking.id}
              providerId={booking.providerId}
              ownerId={booking.ownerId}
            />
          </div>
        )}

        {/* Response Time */}
        {booking.respondedAt && (
          <div className="text-xs text-gray-500 text-right">
            Responded {format(new Date(booking.respondedAt), 'MMM d, yyyy \'at\' HH:mm')}
          </div>
        )}
      </CardContent>

      {/* Booking Cancellation Dialog */}
      <BookingCancellationDialog
        booking={cancellationDialog.booking}
        isOpen={cancellationDialog.isOpen}
        onClose={() => setCancellationDialog({ isOpen: false, booking: null })}
        userType="owner"
      />
    </Card>
  );
}