import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { Calendar, Clock, MapPin, User, Phone, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BookingResponseDialog } from "./booking-response-dialog";
import { BookingCancellationDialog } from "./booking-cancellation-dialog";

interface Booking {
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
  owner: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  dog: {
    name: string;
    breed: string;
  };
}

interface ProviderCalendarProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export default function ProviderCalendar({ bookings, isLoading }: ProviderCalendarProps) {

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [responseDialog, setResponseDialog] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null,
  });
  const [cancellationDialog, setCancellationDialog] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.scheduledDate), date)
    );
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
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleBookingResponse = (booking: Booking) => {

    setResponseDialog({ isOpen: true, booking });
  };

  const handleBookingCancellation = (booking: Booking) => {
    setCancellationDialog({ isOpen: true, booking });
  };

  const getDayBookings = (date: Date) => {
    return getBookingsForDate(date).sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  };

  const selectedDateBookings = getDayBookings(selectedDate);
  const totalDailyEarnings = selectedDateBookings.reduce((sum, booking) => 
    sum + parseFloat(booking.totalAmount), 0
  );

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          My Calendar
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {weekDays.map(day => (
                      <div key={day} className="p-2 text-center font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                      const dayBookings = getBookingsForDate(day);
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isSelected = isSameDay(day, selectedDate);
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "p-2 h-16 text-left border rounded-md transition-colors",
                            isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                            isSelected && "bg-blue-100 border-blue-300",
                            isToday(day) && "bg-blue-50 border-blue-200",
                            dayBookings.length > 0 && "border-green-300"
                          )}
                        >
                          <div className="text-sm font-medium">
                            {format(day, 'd')}
                          </div>
                          {dayBookings.length > 0 && (
                            <div className="text-xs text-green-600">
                              {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Day Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateBookings.length} booking{selectedDateBookings.length !== 1 ? 's' : ''} scheduled
                    {selectedDateBookings.length > 0 && (
                      <span className="block text-green-600 font-medium">
                        Total: R{totalDailyEarnings.toFixed(2)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDateBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No bookings scheduled for this day
                    </p>
                  ) : (
                    selectedDateBookings.map(booking => (
                      <div key={booking.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(booking.scheduledDate), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(booking.status)}
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{booking.service.name}</div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="h-3 w-3" />
                            {booking.owner.firstName} {booking.owner.lastName}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            Dog: {booking.dog.name} ({booking.dog.breed})
                          </div>
                          {booking.owner.phoneNumber && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {booking.owner.phoneNumber}
                            </div>
                          )}
                          
                          {/* Boarding/Pet Sitting specific information */}
                          {(booking.service.name.toLowerCase().includes('boarding') || 
                            booking.service.name.toLowerCase().includes('sitting')) && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-2 space-y-1">
                              {booking.arrivalDate && booking.departureDate && (
                                <div className="text-xs">
                                  <strong>Check-in:</strong> {format(new Date(booking.arrivalDate), 'MMM d, yyyy')} at {format(new Date(booking.arrivalDate), 'HH:mm')}
                                  <br />
                                  <strong>Check-out:</strong> {format(new Date(booking.departureDate), 'MMM d, yyyy')}
                                </div>
                              )}
                              {booking.numberOfDogs && booking.numberOfDogs > 1 && (
                                <div className="text-xs">
                                  <strong>Number of dogs:</strong> {booking.numberOfDogs}
                                </div>
                              )}
                              {booking.kennelPreference && (
                                <div className="text-xs">
                                  <strong>Kennel preference:</strong> {
                                    booking.kennelPreference === 'social' ? 'Social with other dogs' :
                                    booking.kennelPreference === 'individual' ? 'Individual kennel required' :
                                    'No preference'
                                  }
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-green-600 font-medium">
                            R{parseFloat(booking.totalAmount).toFixed(2)}
                          </div>
                        </div>
                        
                        {booking.notes && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {booking.notes}
                          </div>
                        )}



                        {/* Booking Response Section */}
                        <div className="pt-2 border-t">
                          {booking.status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingResponse(booking)}
                              className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Accept or Decline Booking
                            </Button>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Status: {booking.status} - Response not needed
                            </div>
                          )}
                        </div>

                        {/* Cancellation Section */}
                        {(booking.status === 'accepted' || booking.status === 'pending') && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBookingCancellation(booking)}
                              className="flex-1"
                            >
                              Cancel Booking
                            </Button>
                          </div>
                        )}

                        {booking.status !== 'pending' && booking.declineReason && (
                          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <strong>Decline Reason:</strong> {booking.declineReason}
                          </div>
                        )}

                        {booking.status !== 'pending' && booking.providerResponse && (
                          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <strong>Your Message:</strong> {booking.providerResponse}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>
                All your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No bookings scheduled
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                    .map(booking => (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{booking.service.name}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(booking.scheduledDate), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(booking.status)}
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="text-green-600 font-medium">
                              R{parseFloat(booking.totalAmount).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700">Client</div>
                            <div>{booking.owner.firstName} {booking.owner.lastName}</div>
                            {booking.owner.phoneNumber && (
                              <div className="text-gray-600">{booking.owner.phoneNumber}</div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">Dog</div>
                            <div>{booking.dog.name}</div>
                            <div className="text-gray-600">{booking.dog.breed}</div>
                          </div>
                        </div>

                        {/* Boarding/Pet Sitting specific information */}
                        {(booking.service.name.toLowerCase().includes('boarding') || 
                          booking.service.name.toLowerCase().includes('sitting')) && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2">
                            <div className="font-medium text-gray-700 text-sm">Service Details</div>
                            {booking.arrivalDate && booking.departureDate && (
                              <div className="text-sm grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Check-in:</strong> {format(new Date(booking.arrivalDate), 'MMM d, yyyy')} at {format(new Date(booking.arrivalDate), 'HH:mm')}
                                </div>
                                <div>
                                  <strong>Check-out:</strong> {format(new Date(booking.departureDate), 'MMM d, yyyy')}
                                </div>
                              </div>
                            )}
                            {booking.numberOfDogs && booking.numberOfDogs > 1 && (
                              <div className="text-sm">
                                <strong>Number of dogs:</strong> {booking.numberOfDogs}
                              </div>
                            )}
                            {booking.kennelPreference && (
                              <div className="text-sm">
                                <strong>Kennel preference:</strong> {
                                  booking.kennelPreference === 'social' ? 'Social with other dogs' :
                                  booking.kennelPreference === 'individual' ? 'Individual kennel required' :
                                  'No preference'
                                }
                              </div>
                            )}
                          </div>
                        )}
                        
                        {booking.notes && (
                          <div className="text-sm">
                            <div className="font-medium text-gray-700">Notes</div>
                            <div className="text-gray-600">{booking.notes}</div>
                          </div>
                        )}



                        {/* Booking Actions Section */}
                        <div className="flex flex-col gap-2 pt-3 border-t">
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleBookingResponse(booking)}
                              className="w-full bg-green-600 text-white hover:bg-green-700"
                            >
                              ACCEPT OR DECLINE BOOKING
                            </Button>
                          )}
                          
                          {(booking.status === 'accepted' || booking.status === 'pending') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBookingCancellation(booking)}
                              className="w-full"
                            >
                              Cancel Booking
                            </Button>
                          )}
                          
                          {booking.status !== 'pending' && booking.status !== 'accepted' && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              Booking {booking.status} - No actions available
                            </div>
                          )}
                        </div>

                        {booking.status !== 'pending' && booking.declineReason && (
                          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                            <strong>Decline Reason:</strong> {booking.declineReason}
                          </div>
                        )}

                        {booking.status !== 'pending' && booking.providerResponse && (
                          <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                            <strong>Your Message:</strong> {booking.providerResponse}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Response Dialog */}
      <BookingResponseDialog
        booking={responseDialog.booking}
        isOpen={responseDialog.isOpen}
        onClose={() => setResponseDialog({ isOpen: false, booking: null })}
      />

      {/* Booking Cancellation Dialog */}
      <BookingCancellationDialog
        booking={cancellationDialog.booking}
        isOpen={cancellationDialog.isOpen}
        onClose={() => setCancellationDialog({ isOpen: false, booking: null })}
        userType="provider"
      />
    </div>
  );
}