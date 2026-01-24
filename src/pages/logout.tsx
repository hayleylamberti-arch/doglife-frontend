import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Logout() {
  const [logoutStatus, setLogoutStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    performLogout();
  }, []);

  const performLogout = async () => {
    try {
      setLogoutStatus('processing');
      
      // Clear all local data
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      // Aggressive cookie clearing
      const clearAllCookies = () => {
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          // Clear with multiple domain and path combinations
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.replit.com`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.replit.dev`;
        });
      };
      
      clearAllCookies();
      
      // Call server logout with timeout
      const response = await Promise.race([
        fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 5000)
        )
      ]) as Response;
      
      if (response.ok) {
        // Clear cookies again after server response
        clearAllCookies();
        setLogoutStatus('success');
        
        // Redirect to home after showing success
        setTimeout(() => {
          window.location.replace("/");
        }, 1500);
      } else {
        throw new Error('Server logout failed');
      }
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutStatus('error');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    performLogout();
  };

  const handleForceLogout = async () => {
    // Clear everything locally first
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    
    // Aggressive cookie clearing with multiple methods
    const clearAllCookies = () => {
      const cookies = document.cookie.split(";");
      const domains = [
        window.location.hostname,
        '.' + window.location.hostname,
        '.replit.com',
        '.replit.dev'
      ];
      
      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        domains.forEach(domain => {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      });
    };
    
    clearAllCookies();
    
    try {
      // Try server logout with aggressive options
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });
    } catch (error) {
      console.log("Server logout attempt failed, proceeding with force clear");
    }
    
    // Clear cookies again after server call
    clearAllCookies();
    
    // Force redirect to clear all session state
    window.location.replace("/api/auth/login");
  };

  const handleCreateNewAccount = () => {
    // Clear everything first
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    
    // Force new Replit login with prompt
    window.location.replace("/api/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {logoutStatus === 'processing' && "Logging Out..."}
            {logoutStatus === 'success' && "Logout Successful"}
            {logoutStatus === 'error' && "Logout Issue"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          {logoutStatus === 'processing' && (
            <div className="space-y-4">
              <RefreshCw className="h-12 w-12 mx-auto animate-spin text-blue-600" />
              <p className="text-gray-600">
                Clearing your session and data...
              </p>
            </div>
          )}

          {logoutStatus === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-gray-600">
                Successfully logged out! Redirecting to home page...
              </p>
              <div className="text-sm text-gray-500">
                You can now create a new account or log in as a different user.
              </div>
            </div>
          )}

          {logoutStatus === 'error' && (
            <div className="space-y-6">
              <AlertCircle className="h-12 w-12 mx-auto text-orange-600" />
              <div className="space-y-3">
                <p className="text-gray-600">
                  Having trouble logging out completely.
                </p>
                <p className="text-sm text-gray-500">
                  This can happen with persistent sessions. Try the options below:
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  className="w-full"
                  disabled={retryCount >= 3}
                >
                  {retryCount >= 3 ? "Max Retries Reached" : `Retry Logout ${retryCount > 0 ? `(${retryCount})` : ""}`}
                </Button>
                
                <Button 
                  onClick={handleForceLogout} 
                  className="w-full"
                >
                  Force Logout & Clear Session
                </Button>
                
                <Button 
                  onClick={() => {
                    // Nuclear option - clear everything and force fresh start
                    queryClient.clear();
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Clear ALL cookies with extreme prejudice
                    document.cookie.split(";").forEach((c) => {
                      const eqPos = c.indexOf("=");
                      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
                      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
                    });
                    
                    // Force immediate redirect - bypass everything
                    window.location.href = "/api/auth/login";
                  }} 
                  variant="destructive"
                  className="w-full"
                >
                  Nuclear Reset (Immediate Redirect)
                </Button>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    To create a completely new account:
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/new-account"} 
                    variant="default"
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Create New Account Guide
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Get step-by-step instructions for testing with a different account
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              Need help? The test login page allows switching between demo accounts without logging out.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}