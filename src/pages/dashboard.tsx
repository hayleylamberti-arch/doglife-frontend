import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Heart, 
  Calendar, 
  Star, 
  TrendingUp, 
  Award,
  PawPrint,
  Clock,
  MapPin
} from "lucide-react";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Fetch recent bookings
  const { data: recentBookings = [] } = useQuery({
    queryKey: ["/api/bookings/owner"],
    enabled: !!user && user.userType === 'owner',
  });

  // Fetch provider bookings if user is a provider
  const { data: providerBookings = [] } = useQuery({
    queryKey: ["/api/bookings/provider"],
    enabled: !!user && user.userType === 'provider',
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/user/badges"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to DogLife</h2>
              <p className="text-gray-600 mb-4">Please log in to access your personalized dashboard</p>
              <a 
                href="/api/auth/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Log In
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600">
            {user.userType === 'owner' 
              ? "Here's what's happening with your furry friend today" 
              : "Manage your dog services business from your dashboard"
            }
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {user.userType === 'owner' ? 'Upcoming Bookings' : 'Today\'s Bookings'}
                  </p>
                  <p className="text-2xl font-bold">
                    {user.userType === 'owner' 
                      ? recentBookings.filter((b: any) => new Date(b.scheduledDate) > new Date()).length
                      : providerBookings.filter((b: any) => 
                          new Date(b.scheduledDate).toDateString() === new Date().toDateString()
                        ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {user.userType === 'owner' ? 'Reviews Given' : 'Average Rating'}
                  </p>
                  <p className="text-2xl font-bold">
                    {user.userType === 'owner' 
                      ? userStats?.totalReviews || 0
                      : '4.8'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                  <p className="text-2xl font-bold">{userBadges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {user.userType === 'owner' ? 'Total Services' : 'This Month'}
                  </p>
                  <p className="text-2xl font-bold">
                    {user.userType === 'owner' 
                      ? userStats?.totalBookings || 0
                      : providerBookings.filter((b: any) => 
                          new Date(b.scheduledDate).getMonth() === new Date().getMonth()
                        ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {user.userType === 'provider' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {providerBookings.filter((b: any) => 
                    new Date(b.scheduledDate).toDateString() === new Date().toDateString()
                  ).length > 0 ? (
                    <div className="space-y-4">
                      {providerBookings
                        .filter((b: any) => 
                          new Date(b.scheduledDate).toDateString() === new Date().toDateString()
                        )
                        .map((booking: any) => (
                          <div key={booking.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{booking.service.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {booking.owner.firstName} {booking.owner.lastName} - {booking.dog.name}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(booking.scheduledDate).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Duration: {booking.service.duration}min
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No bookings scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(user.userType === 'owner' ? recentBookings : providerBookings)
                    .slice(0, 3)
                    .map((booking: any) => (
                      <div key={booking.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {user.userType === 'owner' 
                              ? `Booked ${booking.service.name}`
                              : `${booking.service.name} with ${booking.owner.firstName}`
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {(booking.service.name.toLowerCase().includes('boarding') || 
                              booking.service.name.toLowerCase().includes('sitting')) && 
                             booking.arrivalDate && booking.departureDate ? (
                              <>
                                {new Date(booking.arrivalDate).toLocaleDateString()} - {new Date(booking.departureDate).toLocaleDateString()}
                                {booking.numberOfDogs > 1 && ` • ${booking.numberOfDogs} dogs`}
                              </>
                            ) : (
                              new Date(booking.scheduledDate).toLocaleDateString()
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {(user.userType === 'owner' ? recentBookings : providerBookings).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="space-y-3">
                    {userBadges.slice(0, 3).map((userBadge: any) => (
                      <div key={userBadge.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Award className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{userBadge.badge.name}</p>
                          <p className="text-xs text-gray-500">{userBadge.badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No badges yet</p>
                    <p className="text-xs text-gray-400">Start using services to earn badges!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.userType === 'owner' ? (
                  <>
                    <a 
                      href="/search" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      Find Services
                    </a>
                    <a 
                      href="/profile" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      Manage Dogs
                    </a>
                    <a 
                      href="/profile?tab=bookings" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      View Bookings
                    </a>
                  </>
                ) : (
                  <>
                    <a 
                      href="/find-clients" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      Find Clients
                    </a>
                    <a 
                      href="/profile?tab=calendar" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      View Calendar
                    </a>
                    <a 
                      href="/profile?tab=business" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      Manage Services
                    </a>
                    <a 
                      href="/profile?tab=team" 
                      className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                    >
                      Team Management
                    </a>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}