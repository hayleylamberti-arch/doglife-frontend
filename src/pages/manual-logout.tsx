import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, RefreshCw, UserPlus, ArrowRight } from "lucide-react";

export default function ManualLogout() {
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <CardTitle className="text-2xl font-bold">Switch to Different Account</CardTitle>
            <p className="text-gray-600">
              Manual steps to test with a different Replit account
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Why manual steps?</h3>
              <p className="text-sm text-yellow-700">
                Replit's authentication system automatically reconnects you even after logout. 
                These manual steps ensure you can test with different accounts.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step-by-Step Instructions:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Open Replit logout in new tab</p>
                    <p className="text-sm text-gray-600">This will log you out of Replit entirely</p>
                    <Button 
                      className="mt-2" 
                      onClick={() => window.open('https://replit.com/logout', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Logout from Replit
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Wait and confirm logout</p>
                    <p className="text-sm text-gray-600">Make sure you're logged out of Replit completely</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Return to this app</p>
                    <p className="text-sm text-gray-600">Close the Replit tab and come back here</p>
                    <Button 
                      className="mt-2" 
                      variant="outline"
                      onClick={() => window.location.href = currentDomain}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Return to App
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium">Login with different account</p>
                    <p className="text-sm text-gray-600">Use a different Replit account to test different user types</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Alternative: Create New Account</h3>
              <p className="text-sm text-gray-600 mb-3">
                If you want to test with a completely fresh account:
              </p>
              <Button 
                onClick={() => window.open('https://replit.com/signup', '_blank')}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Create New Replit Account
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Quick Access</h3>
              <p className="text-sm text-blue-700 mb-3">
                Bookmark this page for easy access: <code className="bg-blue-100 px-1 rounded">{currentDomain}/manual-logout</code>
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => window.open('https://replit.com/logout', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Logout
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}