import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmergencyContacts from "@/components/emergency-contacts";
import { AlertTriangle, Phone, Clock, MapPin, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function EmergencyPage() {
  const { user } = useAuth();
  
  // Check if user has DogLife+ subscription
  const hasPremium = user?.subscriptionType === 'owner_plus';
  
  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-doglife-dark mb-4">
              Emergency Contacts
            </h1>
            <p className="text-xl text-doglife-neutral max-w-2xl mx-auto mb-8">
              Access to emergency veterinary contacts and 24/7 pet services is a DogLife+ premium feature.
            </p>
          </div>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="text-center">
              <Star className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-orange-800">DogLife+ Required</CardTitle>
              <CardDescription className="text-orange-700">
                Upgrade to DogLife+ to access emergency contacts, save custom vet numbers, and get 24/7 pet emergency support.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-6 rounded-lg border border-orange-200 mb-6">
                <h3 className="font-semibold text-orange-800 mb-4">What you'll get with DogLife+:</h3>
                <ul className="text-left text-orange-700 space-y-2 max-w-md mx-auto">
                  <li>• Pre-loaded emergency vet contacts for Johannesburg & Sandton</li>
                  <li>• Save your own custom emergency contacts</li>
                  <li>• One-tap calling to emergency services</li>
                  <li>• GPS directions to nearest emergency vets</li>
                  <li>• National emergency numbers and poison control</li>
                  <li>• Emergency preparedness guidelines</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => window.location.href = '/subscription'}
                >
                  <Star className="h-5 w-5 mr-2" />
                  Upgrade to DogLife+ - R29/month
                </Button>
                
                <p className="text-sm text-orange-600">
                  Start your premium membership today and never worry about finding emergency pet care again.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-doglife-dark mb-4">
              Pet Emergency Contacts
            </h1>
            <p className="text-xl text-doglife-neutral max-w-2xl mx-auto">
              Quick access to emergency veterinary services and 24/7 pet care in Johannesburg and Sandton areas.
            </p>
          </div>
        </div>

        {/* Emergency Tips */}
        <Card className="border-red-200 bg-red-50 mb-8">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Emergency Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-red-800 mb-2">When to Call Emergency Services:</h4>
                <ul className="space-y-1 text-red-700">
                  <li>• Difficulty breathing or choking</li>
                  <li>• Severe bleeding or trauma</li>
                  <li>• Poisoning or toxic ingestion</li>
                  <li>• Seizures or loss of consciousness</li>
                  <li>• Severe pain or distress</li>
                  <li>• Inability to urinate or defecate</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Before You Go:</h4>
                <ul className="space-y-1 text-red-700">
                  <li>• Call ahead to notify the emergency vet</li>
                  <li>• Bring your pet's medical records if possible</li>
                  <li>• Have your ID and payment method ready</li>
                  <li>• Keep your pet calm and secure during transport</li>
                  <li>• If poisoning: bring the substance/container</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts Component */}
        <EmergencyContacts />

        {/* Additional Emergency Resources */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 text-blue-600 mr-2" />
                National Emergency Numbers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">General Emergency</span>
                <Button 
                  size="sm" 
                  onClick={() => window.open('tel:10111', '_self')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Call 10111
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">SPCA Emergency</span>
                <Button 
                  size="sm" 
                  onClick={() => window.open('tel:0800005772', '_self')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Call 0800 005 772
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 text-purple-600 mr-2" />
                Poison Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Pet Poison Helpline</h4>
                <p className="text-sm text-purple-700 mb-3">
                  24/7 animal poison control center. Consultation fee may apply.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => window.open('tel:+18887624771', '_self')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Call +1 888-762-4771
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Notice */}
        <Card className="bg-gray-50 border-gray-200 mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-600">
              <strong>Important:</strong> This information is for emergency reference only. 
              Always contact your regular veterinarian first when possible, and call ahead to emergency services. 
              DogLife is not responsible for the services provided by these emergency contacts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}