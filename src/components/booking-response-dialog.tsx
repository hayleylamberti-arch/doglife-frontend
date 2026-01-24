import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Clock } from "lucide-react";

interface BookingResponseDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingResponseDialog({ booking, isOpen, onClose }: BookingResponseDialogProps) {
  const [response, setResponse] = useState<'accepted' | 'declined' | ''>('');
  const [declineReason, setDeclineReason] = useState('');
  const [providerResponse, setProviderResponse] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!response) throw new Error('Please select accept or decline');
      
      if (response === 'declined' && !declineReason) {
        throw new Error('Please provide a reason for declining');
      }

      await apiRequest('PATCH', `/api/bookings/${booking.id}/respond`, {
        status: response,
        declineReason: response === 'declined' ? declineReason : null,
        providerResponse: providerResponse.trim() || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: `Booking ${response} successfully. The owner has been notified.`,
      });
      // Invalidate both provider and owner booking caches to ensure both sides see updates
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/provider'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/owner'] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      console.error('Booking response error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setResponse('');
    setDeclineReason('');
    setProviderResponse('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'declined':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    }
  };

  if (!booking) return null;

  // Add safety checks for booking properties
  const bookingStatus = booking.status || 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Respond to Booking Request</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Booking Details */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(bookingStatus)}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bookingStatus)}`}>
                {bookingStatus}
              </span>
            </div>
            <h4 className="font-medium">{booking.service?.name || 'Service'}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {booking.owner?.firstName} {booking.owner?.lastName} • {booking.dog?.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(booking.scheduledDate).toLocaleString()}
            </p>
            <p className="text-sm font-medium">R{booking.totalAmount}</p>
          </div>

          {bookingStatus === 'pending' && (
            <>
              {/* Response Selection */}
              <div className="space-y-2">
                <Label htmlFor="response">Your Response</Label>
                <Select value={response} onValueChange={(value: 'accepted' | 'declined') => setResponse(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your response" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">Accept Booking</SelectItem>
                    <SelectItem value="declined">Decline Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Decline Reason */}
              {response === 'declined' && (
                <div className="space-y-2">
                  <Label htmlFor="decline-reason">Reason for Declining *</Label>
                  <Select value={declineReason} onValueChange={setDeclineReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I am no longer available at that time.">
                        I am no longer available at that time.
                      </SelectItem>
                      <SelectItem value="Apologies, I cannot no longer accept your booking.">
                        Apologies, I cannot no longer accept your booking.
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="provider-response">Additional Message (Optional)</Label>
                <Textarea
                  id="provider-response"
                  placeholder="Add a personal message to the dog owner..."
                  value={providerResponse}
                  onChange={(e) => setProviderResponse(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {bookingStatus !== 'pending' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You have already responded to this booking.
              </p>
              {booking.declineReason && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reason: {booking.declineReason}
                </p>
              )}
              {booking.providerResponse && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Your message: {booking.providerResponse}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {bookingStatus === 'pending' && (
            <Button 
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending || !response}
            >
              {mutation.isPending ? "Sending..." : "Send Response"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}