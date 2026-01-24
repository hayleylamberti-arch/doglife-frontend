import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Briefcase } from "lucide-react";

interface TestUser {
  id: string;
  name: string;
  email: string;
  userType: 'owner' | 'provider' | 'admin';
  description: string;
}

const testUsers: TestUser[] = [
  {
    id: '43778848',
    name: 'Hayley Lamberti',
    email: 'hayley.lamberti@gmail.com',
    userType: 'owner',
    description: 'Dog owner with active bookings'
  },
  {
    id: 'provider-001',
    name: 'Sarah Johnson',
    email: 'sarah@dogwalking.com',
    userType: 'provider',
    description: 'Professional dog walker and trainer'
  },
  {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@doglife.com',
    userType: 'admin',
    description: 'Platform administrator'
  }
];

export default function TestLogin() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!selectedUser) {
      toast({
        title: "Please select a user",
        description: "Choose a test user to log in as",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // First logout to clear any existing session
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local storage and cache
      localStorage.clear();
      sessionStorage.clear();

      // Login as selected user
      const response = await fetch(`/api/test-login/${selectedUser}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const user = testUsers.find(u => u.id === selectedUser);
        toast({
          title: "Login successful",
          description: `Logged in as ${user?.name} (${user?.userType})`
        });
        
        // Force a complete page reload to ensure authentication state is updated
        window.location.href = "/";
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged out successfully",
        description: "You can now select a different user"
      });
      
      // Force page reload to ensure clean state
      window.location.href = "/test-login";
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout completed",
        description: "Session cleared"
      });
      window.location.href = "/test-login";
    } finally {
      setIsLoading(false);
    }
  };

  const getUserIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'provider':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getUserColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'text-red-600';
      case 'provider':
        return 'text-blue-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Test Login</CardTitle>
          <p className="text-gray-600">
            Switch between different user types for testing
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Select Test User:</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to test as..." />
              </SelectTrigger>
              <SelectContent>
                {testUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span className={getUserColor(user.userType)}>
                        {getUserIcon(user.userType)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {user.userType} - {user.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className={getUserColor(testUsers.find(u => u.id === selectedUser)?.userType || '')}>
                  {getUserIcon(testUsers.find(u => u.id === selectedUser)?.userType || '')}
                </span>
                <span className="font-medium">
                  {testUsers.find(u => u.id === selectedUser)?.name}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {testUsers.find(u => u.id === selectedUser)?.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleLogin} 
              disabled={!selectedUser || isLoading}
              className="w-full"
            >
              {isLoading ? "Logging in..." : "Login as Selected User"}
            </Button>
            
            <Button 
              onClick={handleLogout} 
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Logging out..." : "Logout Current User"}
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}