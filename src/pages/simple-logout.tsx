import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, RefreshCw } from "lucide-react";

export default function SimpleLogout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Account Switch Required</CardTitle>
          <p className="text-gray-600 text-sm">
            Follow these simple steps to test with a different account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="font-medium text-blue-900 text-sm mb-2">Quick Steps:</h3>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Click "Go to Replit Logout" below</li>
              <li>Log out completely from Replit</li>
              <li>Return here and refresh</li>
              <li>Login with different account</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => window.open('https://replit.com/logout', '_blank')}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Replit Logout
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh This Page
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Bookmark: <code>{window.location.origin}/simple-logout</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}