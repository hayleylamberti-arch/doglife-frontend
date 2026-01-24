import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VerificationCodeDisplayProps {
  bookingId: string;
  appointmentDate: Date;
  providerName: string;
  serviceName: string;
  isUpcoming: boolean;
}

export function VerificationCodeDisplay({
  bookingId,
  appointmentDate,
  providerName,
  serviceName,
  isUpcoming
}: VerificationCodeDisplayProps) {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const { toast } = useToast();

  const hoursUntilAppointment = (appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const showVerificationCode = hoursUntilAppointment <= 3 && hoursUntilAppointment > 0;

  const generateVerificationCode = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest(`/api/bookings/${bookingId}/generate-code`, {
        method: 'POST'
      });
      
      if (response.code) {
        setVerificationCode(response.code);
        toast({
          title: "Security Code Generated",
          description: "Your verification code has been generated and will be sent to your email 2 hours before the appointment."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyCode = async () => {
    if (!inputCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest(`/api/bookings/${bookingId}/verify-code`, {
        method: 'POST',
        body: JSON.stringify({ code: inputCode.trim() })
      });
      
      if (response.valid) {
        setIsVerified(true);
        toast({
          title: "Code Verified Successfully",
          description: "The service provider has been authenticated. You can proceed with confidence."
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect or expired. Please check with your service provider.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sendReminder = async () => {
    try {
      await apiRequest(`/api/bookings/${bookingId}/send-reminder`, {
        method: 'POST'
      });
      
      toast({
        title: "Reminder Sent",
        description: "Verification code reminder has been sent to your email."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isUpcoming) {
    return null; // Don't show for past appointments
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-800">Security Verification</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Appointment security for {serviceName} with {providerName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hoursUntilAppointment > 3 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Verification code will be automatically generated 2 hours before your appointment
            </span>
          </div>
        ) : showVerificationCode ? (
          <div className="space-y-4">
            {!verificationCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Your appointment is approaching. Generate your security code now.
                  </span>
                </div>
                <Button 
                  onClick={generateVerificationCode} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate Security Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Your Security Code</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-green-900 tracking-wider">
                    {verificationCode}
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Share this code with your service provider when they arrive
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Security Instructions:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ask the provider to tell YOU the code (don't show it first)</li>
                    <li>• Only proceed if they know the correct code</li>
                    <li>• If they don't have the code, contact us immediately</li>
                  </ul>
                </div>

                {!isVerified && (
                  <div className="space-y-3">
                    <Label htmlFor="verification-input" className="text-sm font-medium">
                      Verify Provider's Code
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="verification-input"
                        placeholder="Enter the code the provider tells you"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        maxLength={6}
                        className="font-mono"
                      />
                      <Button 
                        onClick={verifyCode} 
                        disabled={isVerifying}
                        variant="outline"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                )}

                {isVerified && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium">
                      Provider verified successfully! You can proceed with confidence.
                    </span>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={sendReminder}
                  className="w-full"
                >
                  Resend Code to Email
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              Appointment has passed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}