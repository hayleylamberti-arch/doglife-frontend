import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import { BannerLayout } from "@/components/banner-layout";
import { Calendar, MapPin, Star, Heart, Clock, TrendingUp, Crown, AlertTriangle } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: userBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings/owner"],
    enabled: !!user && user.userType === 'owner',
    retry: false,
  });

  const { data: providerBookings, isLoading: providerBookingsLoading } = useQuery({
    queryKey: ["/api/bookings/provider"],
    enabled: !!user && user.userType === 'provider',
    retry: false,
  });

  const { data: dogs, isLoading: dogsLoading } = useQuery({
    queryKey: ["/api/dogs"],
    enabled: !!user && user.userType === 'owner',
    retry: false,
  });

  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-doglife-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const isOwner = user.userType === 'owner';
  const isProvider = user.userType === 'provider';

  return (
    <>
      <Navbar />
      <BannerLayout>
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-doglife-dark mb-2">
            Welcome back, {user.firstName || 'Friend'}! 👋
          </h1>
          <p className="text-doglife-neutral">
            {isOwner ? "Find the best care for your furry friends" : "Manage your services and bookings"}
          </p>
        </div>

        {/* Subscription Status */}
        {subscriptionStatus && (
          <>
            {/* Free Trial Active */}
            {subscriptionStatus.subscriptionType === 'trial' && subscriptionStatus.isSubscribed && !subscriptionStatus.isExpired && (
              <Alert className="mb-8 border-blue-200 bg-blue-50">
                <Star className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Free Trial Active</strong> - 
                      Expires {new Date(subscriptionStatus.trialExpiry).toLocaleDateString('en-ZA')}
                    </div>
                    <Link href="/subscription">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Choose Plan
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Active Subscription */}
            {subscriptionStatus.isSubscribed && !subscriptionStatus.isExpired && subscriptionStatus.subscriptionType !== 'trial' && (
              <Alert className="mb-8 border-green-200 bg-green-50">
                <Crown className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Active {subscriptionStatus.subscriptionType === 'pro_plus' ? 'Pro+ Verified' : 
                                             subscriptionStatus.subscriptionType === 'pro' ? 'Pro' : 
                                             subscriptionStatus.subscriptionType === 'starter' ? 'Starter' :
                                             subscriptionStatus.subscriptionType === 'owner_plus' ? 'DogLife+' :
                                             subscriptionStatus.subscriptionType === 'owner_free' ? 'Free Forever' :
                                             subscriptionStatus.subscriptionType} Membership</strong> 
                      {subscriptionStatus.subscriptionExpiry && (
                        <span> - Expires {new Date(subscriptionStatus.subscriptionExpiry).toLocaleDateString('en-ZA')}</span>
                      )}
                    </div>
                    {subscriptionStatus.annualFeeAmount > 0 && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        R{subscriptionStatus.annualFeeAmount}/{subscriptionStatus.billingCycle || 'year'}
                      </Badge>
                    )}
                    {subscriptionStatus.subscriptionType === 'starter' && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Free Plan</Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Expired Subscription */}
            {subscriptionStatus.isExpired && (
              <Alert className="mb-8 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Membership Expired</strong> - 
                      Renew your {subscriptionStatus.subscriptionType} membership to continue accessing premium features
                    </div>
                    <Link href="/subscription">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                        Renew Now
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* No Subscription */}
            {!subscriptionStatus.isSubscribed && !subscriptionStatus.isExpired && (
              <Card className="mb-8 border-l-4 border-l-doglife-secondary bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-doglife-dark mb-2">Unlock Premium Features</h3>
                      <p className="text-doglife-neutral">
                        {isOwner 
                          ? "Upgrade to DogLife+ for unlimited bookings and premium features - just R29/month or R299/year"
                          : "Choose from Starter (Free), Pro (R149/month), or Pro+ Verified (R249/month) plans"
                        }
                      </p>
                    </div>
                    <Link href="/subscription">
                      <Button className="bg-doglife-secondary text-doglife-dark hover:bg-amber-600">
                        {isOwner ? "Upgrade Now" : "Join as Provider"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-doglife-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {isOwner ? (
                    <>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/search">
                          <MapPin className="h-6 w-6 mb-2" />
                          Find Services
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <Heart className="h-6 w-6 mb-2" />
                          My Dogs
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <Calendar className="h-6 w-6 mb-2" />
                          My Bookings
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <Star className="h-6 w-6 mb-2" />
                          Reviews
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <Calendar className="h-6 w-6 mb-2" />
                          Calendar
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <Heart className="h-6 w-6 mb-2" />
                          My Services
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <Star className="h-6 w-6 mb-2" />
                          Reviews
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col">
                        <Link href="/profile">
                          <TrendingUp className="h-6 w-6 mb-2" />
                          Analytics
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-doglife-primary" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(bookingsLoading || providerBookingsLoading) ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(isOwner ? userBookings : providerBookings)?.slice(0, 5).map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg hover:bg-gray-50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-doglife-dark">
                              {booking.service.name}
                            </h4>
                            <p className="text-sm text-doglife-neutral">
                              {isOwner ? booking.provider.businessName : booking.owner.firstName + ' ' + booking.owner.lastName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={booking.status === 'confirmed' || booking.status === 'accepted' ? 'default' : 
                                     booking.status === 'completed' ? 'secondary' : 
                                     booking.status === 'pending' ? 'destructive' : 'destructive'}
                            >
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium text-doglife-dark mt-1">
                              R{booking.totalAmount}
                            </p>
                          </div>
                        </div>
                        
                        {/* Date information */}
                        <div className="flex items-center text-sm text-doglife-neutral">
                          <Clock className="h-4 w-4 mr-1" />
                          {(booking.service.name.toLowerCase().includes('boarding') || 
                            booking.service.name.toLowerCase().includes('sitting')) && 
                           booking.arrivalDate && booking.departureDate ? (
                            <span>
                              {new Date(booking.arrivalDate).toLocaleDateString()} - {new Date(booking.departureDate).toLocaleDateString()}
                              {booking.numberOfDogs > 1 && ` • ${booking.numberOfDogs} dogs`}
                            </span>
                          ) : (
                            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-doglife-neutral">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No bookings yet</p>
                        {isOwner && (
                          <Button asChild className="mt-4">
                            <Link href="/search">Find Services</Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-doglife-primary text-white flex items-center justify-center mr-4 text-xl font-bold">
                      {user.firstName?.[0] || user.email?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-doglife-dark">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-doglife-neutral capitalize">
                      {user.userType}
                    </p>
                    {user.isSubscribed && (
                      <Badge className="mt-1 bg-doglife-accent text-white">
                        Premium Member
                      </Badge>
                    )}
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">View Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Dogs for Owners */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-doglife-primary" />
                    My Dogs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dogsLoading ? (
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : dogs && dogs.length > 0 ? (
                    <div className="space-y-3">
                      {dogs.slice(0, 3).map((dog: any) => (
                        <div key={dog.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-doglife-dark">{dog.name}</p>
                            <p className="text-sm text-doglife-neutral">{dog.breed}</p>
                          </div>
                          <Badge variant="outline">{dog.age}y</Badge>
                        </div>
                      ))}
                      {dogs.length > 3 && (
                        <Button asChild variant="ghost" size="sm" className="w-full">
                          <Link href="/profile">View All ({dogs.length})</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-doglife-neutral mb-3">No dogs added yet</p>
                      <Button asChild size="sm">
                        <Link href="/profile">Add Your Dog</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats for Providers */}
            {isProvider && user.provider && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-doglife-neutral">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-doglife-secondary mr-1" />
                        <span className="font-medium">{user.provider.rating || '0.0'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-doglife-neutral">Reviews</span>
                      <span className="font-medium">{user.provider.totalReviews || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-doglife-neutral">Status</span>
                      <Badge variant={user.provider.isVerified ? "default" : "secondary"}>
                        {user.provider.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <Link href={isOwner ? "/faq-owners" : "/faq-providers"}>FAQ</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <Link href="/about">Contact Support</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <Link href="/about">About DogLife</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <Card className="border-2 border-doglife-accent">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-doglife-primary">
                Want DogLife in other areas?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-doglife-neutral mb-6">
                We're currently serving Johannesburg and Sandton areas. If you'd like 
                DogLife to come to your suburb, let us know and we'll notify you when we expand!
              </p>
              <Button asChild className="bg-doglife-accent hover:bg-doglife-primary">
                <Link href="/prospect-enquiry">Join Our Waiting List</Link>
              </Button>
              <p className="text-sm text-doglife-neutral mt-4">
                <strong>Gauteng first. South Africa next.</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </BannerLayout>
    </>
  );
}
