import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, Heart, Briefcase, X } from "lucide-react";

// Registration schema
const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phoneNumber: z.string().optional(),
  userType: z.enum(["owner", "provider"], {
    required_error: "Please select account type",
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserType?: 'owner' | 'provider' | null;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  defaultUserType,
  defaultMode = 'register'
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login } = useAuth();

  const registerForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      userType: defaultUserType || undefined,
      termsAccepted: false,
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({
      email: z.string().email("Invalid email address"),
    })),
    defaultValues: {
      email: "",
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const { confirmPassword, termsAccepted, ...registrationData } = data;
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });
      registerForm.reset();
      setMode('login');
    },
    onError: (error: any) => {
      const errorMessage = error.error || "Registration failed. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Store token and update auth state
      login(data.token, data.user);
      
      toast({
        title: "Login successful!",
        description: "Welcome back to DogCare Connect.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      loginForm.reset();
      onClose();
      // No need to reload - auth state is updated directly
    },
    onError: (error: any) => {
      const errorMessage = error.error || "Login failed. Please check your credentials.";
      if (error.requiresVerification) {
        toast({
          title: "Email verification required",
          description: "Please check your email and verify your account before logging in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset requested",
        description: "If an account exists with this email, you'll receive reset instructions.",
      });
      setMode('login');
      forgotPasswordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.error || "Failed to send password reset email.",
        variant: "destructive",
      });
    },
  });

  const selectedUserType = registerForm.watch("userType");

  const onRegisterSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onForgotPasswordSubmit = (data: { email: string }) => {
    forgotPasswordMutation.mutate(data);
  };

  const renderPasswordRequirements = () => {
    const password = registerForm.watch("password");
    const requirements = [
      { text: "At least 8 characters", met: password?.length >= 8 },
      { text: "One uppercase letter", met: /[A-Z]/.test(password || "") },
      { text: "One lowercase letter", met: /[a-z]/.test(password || "") },
      { text: "One number", met: /\d/.test(password || "") },
      { text: "One special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || "") },
    ];

    return (
      <div className="text-sm space-y-1">
        <p className="font-medium text-gray-700">Password requirements:</p>
        {requirements.map((req, index) => (
          <div key={index} className={`flex items-center gap-2 ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-600' : 'bg-gray-300'}`} />
            <span>{req.text}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {mode === 'register' && "Join DogCare Connect"}
              {mode === 'login' && "Welcome Back"}
              {mode === 'forgot-password' && "Reset Password"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {mode === 'register' && (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
              {/* User Type Selection */}
              <FormField
                control={registerForm.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I want to:</FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={field.value === "owner" ? "default" : "outline"}
                        className={`p-4 h-auto flex-col space-y-2 ${
                          field.value === "owner" ? "border-blue-600 bg-blue-50" : ""
                        }`}
                        onClick={() => field.onChange("owner")}
                      >
                        <Heart className="h-6 w-6 text-orange-500" />
                        <div className="text-center">
                          <div className="font-semibold">Find Services</div>
                          <div className="text-xs">For my dog</div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "provider" ? "default" : "outline"}
                        className={`p-4 h-auto flex-col space-y-2 ${
                          field.value === "provider" ? "border-blue-600 bg-blue-50" : ""
                        }`}
                        onClick={() => field.onChange("provider")}
                      >
                        <Briefcase className="h-6 w-6 text-blue-600" />
                        <div className="text-center">
                          <div className="font-semibold">Offer Services</div>
                          <div className="text-xs">For dog owners</div>
                        </div>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="082 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a strong password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {registerForm.watch("password") && (
                <div className="bg-gray-50 p-3 rounded-md">
                  {renderPasswordRequirements()}
                </div>
              )}

              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        I agree to the{" "}
                        <a href="/terms" className="text-blue-600 hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Button 
                  variant="ghost" 
                  onClick={() => setMode('login')} 
                  className="text-blue-600 hover:underline p-0 h-auto"
                >
                  Sign In
                </Button>
              </p>
            </div>
          </Form>
        )}

        {mode === 'login' && (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setMode('forgot-password')} 
                  className="text-blue-600 hover:underline p-0 h-auto text-sm"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Button 
                  variant="ghost" 
                  onClick={() => setMode('register')} 
                  className="text-blue-600 hover:underline p-0 h-auto"
                >
                  Sign Up
                </Button>
              </p>
            </div>
          </Form>
        )}

        {mode === 'forgot-password' && (
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {forgotPasswordMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setMode('login')} 
                className="text-blue-600 hover:underline p-0 h-auto"
              >
                Back to Sign In
              </Button>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}