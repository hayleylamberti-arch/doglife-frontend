import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Crown, Check, Calendar, CreditCard, AlertTriangle, Star, Zap, Shield, TrendingUp, X } from "lucide-react";

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'owner_plus' | 'starter' | 'pro' | 'pro_plus' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: { subscriptionType: 'owner_plus' | 'starter' | 'pro' | 'pro_plus', billingCycle: 'monthly' | 'annual' }) => 
      apiRequest("POST", "/api/subscription/subscribe", data),
    onSuccess: () => {
      toast({
        title: "Subscription Activated",
        description: "Your membership has been successfully activated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: () => {
      toast({
        title: "Subscription Failed",
        description: "Unable to activate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (subscriptionType: 'owner_plus' | 'starter' | 'pro' | 'pro_plus') => {
    setSelectedPlan(subscriptionType);
    // In a real app, this would redirect to payment processing
    // For now, we'll simulate the subscription activation
    subscribeMutation.mutate({ subscriptionType, billingCycle: user?.userType === 'owner' ? billingCycle : billingCycle });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = subscriptionStatus?.isExpired;
  const isSubscribed = subscriptionStatus?.isSubscribed;
  const isOnTrial = subscriptionStatus?.subscriptionType === 'trial';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-doglife-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded"></div>
              <div className="h-96 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-doglife-dark mb-4">
            DogLife Membership Plans
          </h1>
          <p className="text-lg text-doglife-neutral max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your needs. {user?.userType === 'provider' ? 'Grow your dog service business' : 'Find trusted dog care services'} with DogLife's premium platform.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-doglife-dark font-semibold' : 'text-doglife-neutral'}`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'annual'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            />
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-doglife-dark font-semibold' : 'text-doglife-neutral'}`}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                Save up to {user?.userType === 'provider' ? '17%' : '17%'}
              </Badge>
            )}
          </div>
        </div>

        {/* Current Subscription Status */}
        {isOnTrial && isSubscribed && !isExpired && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Star className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Welcome to DogLife!</strong> You're enjoying your free 1-month trial until {formatDate(subscriptionStatus.trialExpiry)}. Choose a membership plan below to continue accessing South Africa's premium dog services.
            </AlertDescription>
          </Alert>
        )}

        {isSubscribed && !isExpired && !isOnTrial && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <Crown className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Active Membership:</strong> Your {subscriptionStatus.subscriptionType} membership is active until {formatDate(subscriptionStatus.subscriptionExpiry)}
            </AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Access Expired:</strong> Your {isOnTrial ? 'free trial' : 'membership'} has expired. Choose a plan below to continue using DogLife services.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Plans */}
        {user?.userType === 'owner' ? (
          // Dog Owner Plans - Two Tier Structure
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {/* Free Forever Plan */}
            <Card className={`relative ${selectedPlan === 'owner_free' ? 'ring-2 ring-gray-500' : ''} ${subscriptionStatus?.subscriptionType === 'owner_free' ? 'bg-gray-50' : ''}`}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-gray-600" />
                </div>
                <CardTitle className="text-xl font-bold text-doglife-dark">👛 Free Forever</CardTitle>
                <div className="text-3xl font-bold text-gray-600 mb-2">
                  R0
                  <span className="text-lg font-normal text-doglife-neutral">/month</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Always Free</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited search & browse</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Up to 2 booking requests/month</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">No save favourites</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">No emergency contacts</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">No verified provider filter</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">No exclusive tips & offers</span>
                  </li>
                </ul>
                
                {subscriptionStatus?.subscriptionType === 'owner_free' ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Star className="h-4 w-4 mr-2" />
                    Current Plan
                  </Badge>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => handleSubscribe('owner_free')}
                    disabled={subscribeMutation.isPending && selectedPlan === 'owner_free'}
                  >
                    {subscribeMutation.isPending && selectedPlan === 'owner_free' ? 'Processing...' : 'Choose Free Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* DogLife+ Plan */}
            <Card className={`relative ${selectedPlan === 'owner_plus' ? 'ring-2 ring-blue-500' : ''} ${subscriptionStatus?.subscriptionType === 'owner_plus' ? 'bg-blue-50' : ''} border-2 border-blue-200`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">Recommended</Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-doglife-dark">🌟 DogLife+</CardTitle>
                <p className="text-sm text-blue-600 mb-4">More features. More peace of mind.</p>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  R{billingCycle === 'monthly' ? '29' : '299'}
                  <span className="text-lg font-normal text-doglife-neutral">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'annual' && <Badge className="bg-green-100 text-green-800 text-xs">Save R49/year</Badge>}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited search & browse</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited booking requests</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Save favourites</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Emergency contacts</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Verified provider filter</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Exclusive tips & offers</span>
                  </li>
                </ul>
                
                {subscriptionStatus?.subscriptionType === 'owner_plus' ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Star className="h-4 w-4 mr-2" />
                    Current Plan
                  </Badge>
                ) : (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={() => handleSubscribe('owner_plus')}
                    disabled={subscribeMutation.isPending && selectedPlan === 'owner_plus'}
                  >
                    {subscribeMutation.isPending && selectedPlan === 'owner_plus' ? 'Processing...' : 'Choose DogLife+'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Service Provider Plans - Three Tier Structure
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {/* Starter Plan */}
            <Card className={`relative ${selectedPlan === 'starter' ? 'ring-2 ring-blue-500' : ''} ${subscriptionStatus?.subscriptionType === 'starter' ? 'bg-gray-50' : ''}`}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Star className="h-8 w-8 text-gray-600" />
                </div>
                <CardTitle className="text-xl font-bold text-doglife-dark">🐾 Starter</CardTitle>
                <p className="text-sm text-gray-600 mb-4">Get listed & start small</p>
                <div className="text-3xl font-bold text-gray-600 mb-2">
                  R0
                  <span className="text-lg font-normal text-doglife-neutral">/month</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Free Forever</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Standard search placement</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>1 service listing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>1 suburb coverage</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Manual booking requests</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">No verified badge</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">No booking analytics</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-600 text-sm">Community support</span>
                  </li>
                </ul>
                
                {subscriptionStatus?.subscriptionType === 'starter' ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Star className="h-4 w-4 mr-2" />
                    Current Plan
                  </Badge>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => handleSubscribe('starter')}
                    disabled={subscribeMutation.isPending && selectedPlan === 'starter'}
                  >
                    {subscribeMutation.isPending && selectedPlan === 'starter' ? 'Processing...' : 'Start Free'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro Plan - Most Popular */}
            <Card className={`relative ${selectedPlan === 'pro' ? 'ring-2 ring-orange-500' : ''} ${subscriptionStatus?.subscriptionType === 'pro' ? 'bg-orange-50' : ''} border-2 border-orange-200`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-bold text-doglife-dark">🐶 Pro</CardTitle>
                <p className="text-sm text-orange-600 mb-4">Grow your bookings</p>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  R{billingCycle === 'monthly' ? '149' : '1499'}
                  <span className="text-lg font-normal text-doglife-neutral">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'annual' && <Badge className="bg-green-100 text-green-800 text-xs">Save R290/year</Badge>}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-orange-500 mr-3 flex-shrink-0" />
                    <span>Higher search placement</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited service listings</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Up to 5 suburb coverage</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-4 w-4 text-orange-500 mr-3 flex-shrink-0" />
                    <span>Manual & automated booking</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Booking analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Customer reminders</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-600 text-sm font-medium">Email support</span>
                  </li>
                </ul>
                
                {subscriptionStatus?.subscriptionType === 'pro' ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Star className="h-4 w-4 mr-2" />
                    Current Plan
                  </Badge>
                ) : (
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                    onClick={() => handleSubscribe('pro')}
                    disabled={subscribeMutation.isPending && selectedPlan === 'pro'}
                  >
                    {subscribeMutation.isPending && selectedPlan === 'pro' ? 'Processing...' : 'Choose Pro'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro+ Verified Plan */}
            <Card className={`relative ${selectedPlan === 'pro_plus' ? 'ring-2 ring-purple-500' : ''} ${subscriptionStatus?.subscriptionType === 'pro_plus' ? 'bg-purple-50' : ''}`}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-doglife-dark">🥇 Pro+ Verified</CardTitle>
                <p className="text-sm text-purple-600 mb-4">Stand out & build trust</p>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  R{billingCycle === 'monthly' ? '249' : '2499'}
                  <span className="text-lg font-normal text-doglife-neutral">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'annual' && <Badge className="bg-green-100 text-green-800 text-xs">Save R489/year</Badge>}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                    <span>Priority search placement</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited service listings</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited suburb coverage</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                    <span>Auto-confirmation booking</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">Verified badge</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Analytics & promo campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>Marketing assets included</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-purple-600 text-sm font-medium">Priority email support</span>
                  </li>
                </ul>
                
                {subscriptionStatus?.subscriptionType === 'pro_plus' ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Star className="h-4 w-4 mr-2" />
                    Current Plan
                  </Badge>
                ) : (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                    onClick={() => handleSubscribe('pro_plus')}
                    disabled={subscribeMutation.isPending && selectedPlan === 'pro_plus'}
                  >
                    {subscribeMutation.isPending && selectedPlan === 'pro_plus' ? 'Processing...' : 'Choose Pro+'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-doglife-dark mb-2">Annual Billing</h3>
                <p className="text-doglife-neutral mb-4">
                  All memberships are billed annually. Your subscription automatically renews unless cancelled.
                </p>
                <ul className="space-y-2 text-sm text-doglife-neutral">
                  <li>• Secure payment processing</li>
                  <li>• 30-day money-back guarantee</li>
                  <li>• Cancel anytime before renewal</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-doglife-dark mb-2">Service Payments</h3>
                <p className="text-doglife-neutral mb-4">
                  <strong>Important:</strong> Dog owners pay service providers directly for each booking. The platform does not process service payments.
                </p>
                <p className="text-xs text-doglife-neutral">
                  Membership fees are separate from individual service payments between owners and providers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-doglife-dark mb-2">Can I change my plan later?</h4>
                <p className="text-doglife-neutral">Yes, you can upgrade or change your plan at any time. The price difference will be prorated.</p>
              </div>
              <div>
                <h4 className="font-semibold text-doglife-dark mb-2">What happens if I cancel?</h4>
                <p className="text-doglife-neutral">You'll retain access to premium features until your current billing period ends. No partial refunds for mid-cycle cancellations.</p>
              </div>
              <div>
                <h4 className="font-semibold text-doglife-dark mb-2">Are there any setup fees?</h4>
                <p className="text-doglife-neutral">No setup fees. The annual membership fee is all you pay for complete access to the platform.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}