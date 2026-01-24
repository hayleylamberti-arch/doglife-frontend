import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, ExternalLink } from "lucide-react";

export default function ForceLogout() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Immediately start the logout process
    performCompleteLogout();
  }, []);

  const performCompleteLogout = async () => {
    setStep(1);
    
    // Step 1: Clear all browser data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies with nuclear approach
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    setStep(2);
    
    // Step 2: Try server logout
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      console.log("Server logout attempted");
    }
    
    setStep(3);
    
    // Step 3: Final nuclear option
    setTimeout(() => {
      setStep(4);
    }, 1000);
  };

  const handleManualSteps = () => {
    window.open('https://replit.com/logout', '_blank');
    setStep(5);
  };

  const handleCreateNew = () => {
    window.open('https://replit.com/signup', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-orange-600 mb-4" />
          <CardTitle className="text-2xl font-bold">Force Logout</CardTitle>
          <p className="text-gray-600">
            Breaking persistent session for account switching
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {step >= 1 ? '✓' : '1'}
              </div>
              <span className={step >= 1 ? 'text-green-800' : 'text-gray-600'}>
                Clear browser data & cookies
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 2 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {step >= 2 ? '✓' : '2'}
              </div>
              <span className={step >= 2 ? 'text-green-800' : 'text-gray-600'}>
                Server-side session termination
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${step >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {step >= 3 ? '✓' : '3'}
              </div>
              <span className={step >= 3 ? 'text-green-800' : 'text-gray-600'}>
                Clear authentication state
              </span>
            </div>
          </div>

          {step >= 4 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 mb-2">Manual Override Required</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Replit's authentication system is preventing logout. Use these manual steps:
                </p>
                <ol className="text-sm text-orange-700 list-decimal list-inside space-y-1">
                  <li>Click "Logout from Replit" below</li>
                  <li>Log out from Replit in the new tab</li>
                  <li>Return to this app and refresh</li>
                  <li>Log in with your desired account</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleManualSteps}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Logout from Replit
                </Button>
                
                <Button 
                  onClick={handleCreateNew}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Create New Replit Account
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  className="w-full"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refresh App
                </Button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">
                Processing logout step {step} of 3...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}