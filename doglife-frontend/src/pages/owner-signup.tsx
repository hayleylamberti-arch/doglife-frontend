import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Enhanced form validation schema with comprehensive validation
const signupSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address (e.g., john@example.com)")
    .max(100, "Email must be less than 100 characters")
    .toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be less than 50 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (!@#$%^&* etc.)")
});

type SignupForm = z.infer<typeof signupSchema>;

export default function OwnerSignup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    
    try {
      // 1. Sign up owner
      const signupResponse = await fetch('/api/auth/signup-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!signupResponse.ok) {
        const error = await signupResponse.json();
        throw new Error(error.error || 'Signup failed');
      }

      // 2. Login to get JWT token
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.error || 'Login failed');
      }

      const loginData = await loginResponse.json();
      
      // 3. Store JWT token
      localStorage.setItem('token', loginData.token);

      toast({
        title: "Account created successfully!",
        description: "Welcome to DogLife! You can now manage your dogs."
      });

      // 4. Redirect to My Dogs page
      navigate('/my-dogs');
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Please check your information and try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join DogLife</h1>
          <p className="text-lg text-gray-600">Create your account to start managing your dogs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Owner Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-signup"
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}