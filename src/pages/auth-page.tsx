// (imports unchanged)
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Lock, User, Phone, UserCheck, Building, ArrowLeft } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ProviderRegistrationForm from "@/components/provider-registration-form";
import Brand from "@/components/Brand";

/* ------------------ schemas unchanged ------------------ */

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/* other schemas unchanged */

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const { toast } = useToast();

  /* ------------------ reset token detection ------------------ */

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setResetToken(token);
      setActiveTab("reset");
    }
  }, []);

  /* ------------------ redirect logic ------------------ */

  useEffect(() => {
    if (!user || resetToken) return;

    if (user.role === "SUPPLIER" && !user.onboardingCompleted) {
      navigate("/supplier-onboarding", { replace: true });
      return;
    }

    if (user.role === "SUPPLIER") {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (user.role === "OWNER") {
      navigate("/add-dog", { replace: true });
      return;
    }
  }, [user, resetToken, navigate]);

  /* ------------------ forms unchanged ------------------ */

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /* ------------------ login handler ------------------ */

  const onLogin = (data: any) => {
    loginMutation.mutate(data);
  };

  /* ------------------ layout ------------------ */

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* LEFT SIDE */}
      <div className="flex-1 flex items-center justify-center p-8">

        {/* wider card for tablets */}
        <div className="w-full max-w-lg space-y-6">

          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Brand />
            </div>

            <p className="text-muted-foreground mt-2">
              Connect with trusted dog service providers in your area
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Owner Sign Up</TabsTrigger>
              <TabsTrigger value="provider">Provider Sign Up</TabsTrigger>
            </TabsList>

            {/* ---------------- LOGIN TAB ---------------- */}

            <TabsContent value="login">

              <Card>

                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)}>

                    <CardContent className="space-y-4">

                      {/* email */}
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="email" placeholder="your@email.com" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* password */}
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="password" placeholder="Your password" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">

                      {/* UPDATED LOGIN BUTTON */}
                      <Button
                        type="submit"
                        className="w-full h-11 text-base"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing you in...
                          </span>
                        ) : (
                          "Sign In"
                        )}
                      </Button>

                      <div className="flex flex-col space-y-2 text-sm">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-muted-foreground hover:text-primary underline text-center"
                        >
                          Forgot your password?
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowResendVerification(true)}
                          className="text-muted-foreground hover:text-primary underline text-center"
                        >
                          Resend verification email
                        </button>
                      </div>

                    </CardFooter>

                  </form>
                </Form>

              </Card>

            </TabsContent>

            {/* other tabs unchanged */}
            <TabsContent value="provider">
              <ProviderRegistrationForm onSuccess={() => navigate("/supplier-profile")} />
            </TabsContent>

          </Tabs>

        </div>
      </div>

      {/* RIGHT SIDE HERO */}

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-8">
        <div className="text-center text-white max-w-md">

          <h2 className="text-4xl font-bold mb-6">
            Your Dog's Best Life Starts Here
          </h2>

          <p className="text-xl mb-8 opacity-90">
            Connect with trusted professionals for grooming, boarding,
            walking, training, and more.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Verified service providers</span>
            </div>

            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Real-time booking & communication</span>
            </div>

            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>5-star rating system</span>
            </div>

            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Secure payments & messaging</span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}