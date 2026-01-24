import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users, DollarSign } from "lucide-react";
import ProviderCalendar from "@/components/provider-calendar";

export default function ProviderDashboard() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/bookings/provider'],
    retry: false,
  });



  const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
  const acceptedBookings = bookings.filter((b: any) => b.status === 'accepted');
  const totalEarnings = acceptedBookings.reduce((sum: number, booking: any) => 
    sum + parseFloat(booking.totalAmount), 0
  );

  const stats = [
    {
      title: "Pending Requests",
      value: pendingBookings.length,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
    },
    {
      title: "Confirmed Bookings",
      value: acceptedBookings.length,
      icon: CalendarDays,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Total Clients",
      value: new Set(bookings.map((b: any) => b.ownerId)).size,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: "Expected Earnings",
      value: `R${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bookings and respond to client requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Requests Alert */}
      {pendingBookings.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <Clock className="h-5 w-5" />
              Pending Booking Requests
            </CardTitle>
            <CardDescription>
              You have {pendingBookings.length} booking request{pendingBookings.length !== 1 ? 's' : ''} waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingBookings.slice(0, 3).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <div className="font-medium">{booking.service.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.owner.firstName} {booking.owner.lastName} • {new Date(booking.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                    Pending
                  </Badge>
                </div>
              ))}
              {pendingBookings.length > 3 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  And {pendingBookings.length - 3} more pending request{pendingBookings.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="requests">Booking Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <ProviderCalendar bookings={bookings} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Booking Requests</CardTitle>
              <CardDescription>
                Review and respond to client booking requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No booking requests yet
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .sort((a: any, b: any) => {
                      // Sort by status (pending first) then by date
                      if (a.status === 'pending' && b.status !== 'pending') return -1;
                      if (a.status !== 'pending' && b.status === 'pending') return 1;
                      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
                    })
                    .map((booking: any) => (
                      <Card key={booking.id} className={
                        booking.status === 'pending' ? 'border-yellow-200 dark:border-yellow-800' : ''
                      }>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{booking.service.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {booking.owner.firstName} {booking.owner.lastName} • {booking.dog.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                booking.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              }>
                                {booking.status}
                              </Badge>
                              <div className="text-sm text-green-600 font-medium mt-1">
                                R{parseFloat(booking.totalAmount).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div>📅 {new Date(booking.scheduledDate).toLocaleString()}</div>
                            {booking.notes && (
                              <div className="mt-1">💬 {booking.notes}</div>
                            )}
                          </div>
                          
                          {booking.status !== 'pending' && (
                            <div className="space-y-2">
                              {booking.declineReason && (
                                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                  <strong>Decline Reason:</strong> {booking.declineReason}
                                </div>
                              )}
                              {booking.providerResponse && (
                                <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                  <strong>Your Message:</strong> {booking.providerResponse}
                                </div>
                              )}
                              {booking.respondedAt && (
                                <div className="text-xs text-gray-500 text-right">
                                  Responded {new Date(booking.respondedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}