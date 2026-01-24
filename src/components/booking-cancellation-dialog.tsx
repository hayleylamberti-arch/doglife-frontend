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
import { AlertTriangle, Clock, Banknote } from "lucide-react";
import { format } from "date-fns";

interface BookingCancellationDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  userType?: 'owner' | 'provider';
}

export function BookingCancellationDialog({ 
  booking, 
  isOpen, 
  onClose, 
  userType = 'owner' 
}: BookingCancellationDialogProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!cancellationReason) {
        throw new Error('Please select a cancellation reason');
      }

      const finalReason = cancellationReason === 'other' ? customReason : cancellationReason;
      
      if (cancellationReason === 'other' && !customReason.trim()) {
        throw new Error('Please provide a custom cancellation reason');
      }

      await apiRequest('PATCH', `/api/bookings/${booking.id}/cancel`, {
        cancellationReason: finalReason,
        cancelledBy: userType,
      });
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully. All parties have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/owner'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/provider'] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCancellationReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Calculate cancellation fee for owners
  const calculateCancellationFee = () => {
    if (userType !== 'owner' || !booking) return 0;
    
    const now = new Date();
    const scheduledDate = new Date(booking.scheduledDate);
    const hoursUntilService = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const totalAmount = parseFloat(booking.totalAmount);
    
    if (hoursUntilService < 24) {
      return totalAmount * 0.5; // 50% fee
    } else if (hoursUntilService < 48) {
      return totalAmount * 0.25; // 25% fee
    }
    return 0; // No fee for 48+ hours advance
  };

  const cancellationFee = calculateCancellationFee();
  const hoursUntilService = booking ? 
    (new Date(booking.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60) : 0;

  const ownerReasons = [
    'Something urgent came up and I cannot make it',
    'My dog is not feeling well',
    'Change in travel plans',
    'Found alternative service provider',
    'Financial constraints',
    'other'
  ];

  const providerReasons = [
    'Emergency situation prevents me from providing service',
    'Illness or personal emergency',
    'Equipment malfunction or unavailable',
    'Double booking error',
    'Weather or safety concerns',
    'other'
  ];

  const reasons = userType === 'owner' ? ownerReasons : providerReasons;

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Booking Details */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium">{booking?.service?.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {booking?.owner?.firstName} {booking?.owner?.lastName} • {booking?.dog?.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {booking?.scheduledDate && format(new Date(booking.scheduledDate), 'MMM d, yyyy \'at\' HH:mm')}
            </p>
            <p className="text-sm font-medium">R{booking?.totalAmount}</p>
          </div>

          {/* Cancellation Fee Warning for Owners */}
          {userType === 'owner' && cancellationFee > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 mb-2">
                <Banknote className="h-4 w-4" />
                <span className="font-medium">Cancellation Fee</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">
                Cancelling {hoursUntilService < 24 ? 'less than 24 hours' : 'less than 48 hours'} before 
                the service incurs a cancellation fee of <strong>R{cancellationFee.toFixed(2)}</strong>.
              </p>
            </div>
          )}

          {/* No Fee for Providers */}
          {userType === 'provider' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Provider Cancellation</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                As a provider, no cancellation fee applies to you. The client will be notified immediately.
              </p>
            </div>
          )}

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Reason for Cancellation *</Label>
            <Select value={cancellationReason} onValueChange={setCancellationReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason, index) => (
                  <SelectItem key={index} value={reason}>
                    {reason === 'other' ? 'Other (please specify)' : reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason */}
          {cancellationReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Custom Reason *</Label>
              <Textarea
                id="custom-reason"
                placeholder="Please provide a detailed reason for cancellation..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Final Confirmation */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Please confirm:</strong> This action cannot be undone. All parties will be notified of the cancellation.
              {userType === 'owner' && cancellationFee > 0 && (
                <> A cancellation fee of R{cancellationFee.toFixed(2)} will be charged.</>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Keep Booking
          </Button>
          <Button 
            variant="destructive"
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending || !cancellationReason}
          >
            {mutation.isPending ? "Cancelling..." : "Cancel Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}