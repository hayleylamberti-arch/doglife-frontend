import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, UserPlus, Info, ArrowRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function NewAccount() {
  useEffect(() => {
    // Clear all local data when visiting this page
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    });
  }, []);

  const handleCreateNewAccount = () => {
    // Force redirect to Replit login which will prompt for account selection
    window.location.replace("/api/auth/login");
  };

  const handleTestAccounts = () => {
    window.location.href = "/test-login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <CardTitle className="text-2xl font-bold">Create New Account</CardTitle>
            <p className="text-gray-600">
              Ready to test the platform with a different Replit account?
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900">How this works</h3>
                  <p className="text-sm text-blue-700">
                    The DogLife platform uses Replit authentication. To test with a new account, 
                    you'll need to log in with a different Replit account. This allows you to experience 
                    the platform as a completely new user.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Button 
                  onClick={handleCreateNewAccount}
                  size="lg"
                  className="w-full max-w-sm"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Login with Different Replit Account
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  You'll be redirected to Replit where you can choose a different account
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleTestAccounts}
                  variant="outline"
                  size="lg"
                  className="w-full max-w-sm"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Use Demo Test Accounts
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Switch between Owner, Provider, and Admin demo accounts
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3 text-sm text-gray-600">
              <h4 className="font-medium text-gray-900">Quick Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click "Login with Different Replit Account" above</li>
                <li>If you're signed into Replit, you may need to sign out first</li>
                <li>Sign in with the Replit account you want to use</li>
                <li>Complete the DogLife registration as Owner, Provider, or Admin</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Testing Different User Types</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">🐕 Dog Owner</h4>
                <p className="text-gray-600">
                  Book services, manage dogs, view providers, rate services
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700">🏢 Service Provider</h4>
                <p className="text-gray-600">
                  Manage services, accept bookings, set availability, receive ratings
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-purple-700">⚙️ Administrator</h4>
                <p className="text-gray-600">
                  Manage platform, view analytics, moderate content, oversee operations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}