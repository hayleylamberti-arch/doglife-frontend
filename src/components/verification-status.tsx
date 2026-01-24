import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function VerificationStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: user?.email }),
      });
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your email address.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  const isVerified = user.emailVerified;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Verification
        </CardTitle>
        <CardDescription>
          Your account verification status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isVerified ? "default" : "secondary"} className="flex items-center gap-1">
            {isVerified ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Verified
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Unverified
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Email:</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>

        {!isVerified && (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please verify your email address to access all platform features. 
                Check your inbox and spam folder for the verification email.
              </AlertDescription>
            </Alert>

            {emailSent ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  A new verification email has been sent! Please check your inbox and spam folder.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                onClick={() => resendVerificationMutation.mutate()}
                disabled={resendVerificationMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {resendVerificationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {isVerified && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your email address has been verified! You have full access to all platform features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}