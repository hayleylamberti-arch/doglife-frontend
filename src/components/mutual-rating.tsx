import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MutualRatingProps {
  bookingId: string;
  providerId?: number;
  ownerId?: string;
  onRatingSubmitted?: () => void;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewerType: 'owner' | 'provider';
  createdAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function MutualRating({ bookingId, providerId, ownerId, onRatingSubmitted }: MutualRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user can review this booking
  const { data: reviewPermissions } = useQuery({
    queryKey: ['/api/bookings', bookingId, 'can-review'],
    enabled: !!bookingId
  });

  // Get existing reviews for this booking
  const { data: existingReviews = [] } = useQuery({
    queryKey: ['/api/bookings', bookingId, 'reviews'],
    enabled: !!bookingId
  }) as { data: Review[] };

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string; revieweeId: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!"
      });
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'can-review'] });
      onRatingSubmitted?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive"
      });
    }
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Rating is required to submit your review",
        variant: "destructive"
      });
      return;
    }

    // Determine who to rate based on user type
    let revieweeId = "";
    if (reviewPermissions?.userType === 'owner' && providerId) {
      // Owner rating provider - need to get provider's userId
      // For now, use the providerId as string (this might need adjustment based on your data structure)
      revieweeId = providerId.toString();
    } else if (reviewPermissions?.userType === 'provider' && ownerId) {
      // Provider rating owner
      revieweeId = ownerId;
    }

    if (!revieweeId) {
      toast({
        title: "Error",
        description: "Unable to determine who to rate",
        variant: "destructive"
      });
      return;
    }

    submitReviewMutation.mutate({
      rating,
      comment,
      revieweeId
    });
  };

  const renderStars = (currentRating: number, isInteractive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= currentRating;
      
      return (
        <Star
          key={i}
          className={`h-6 w-6 ${
            isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } ${isInteractive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={isInteractive ? () => setRating(starValue) : undefined}
          onMouseEnter={isInteractive ? () => setHoveredRating(starValue) : undefined}
          onMouseLeave={isInteractive ? () => setHoveredRating(0) : undefined}
        />
      );
    });
  };

  if (!reviewPermissions) {
    return null;
  }

  const canReview = reviewPermissions?.canReview;
  const userType = reviewPermissions?.userType;

  return (
    <div className="space-y-6">
      {/* Existing Reviews */}
      {existingReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reviews</h3>
          {existingReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={review.reviewerType === 'owner' ? 'default' : 'secondary'}>
                      {review.reviewerType === 'owner' ? 'Owner' : 'Provider'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {review.reviewer.firstName} {review.reviewer.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700">{review.comment}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rating Form */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>
              Rate the {userType === 'owner' ? 'Service Provider' : 'Pet Owner'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating (1-5 stars)</label>
              <div 
                className="flex gap-1"
                onMouseLeave={() => setHoveredRating(0)}
              >
                {renderStars(hoveredRating || rating, true)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmitReview}
              disabled={rating === 0 || submitReviewMutation.isPending}
              className="w-full"
            >
              {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </CardContent>
        </Card>
      )}

      {!canReview && existingReviews.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <p>No reviews available for this booking.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}