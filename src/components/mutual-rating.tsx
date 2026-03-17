import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2, Send } from "lucide-react";

interface RatingTarget {
  id: string;
  name: string;
  imageUrl?: string;
  type: 'provider' | 'owner';
}

interface MutualRatingProps {
  bookingId: string;
  target: RatingTarget;
  onComplete?: () => void;
  existingRating?: {
    rating: number;
    review?: string;
  };
  readOnly?: boolean;
}

export default function MutualRating({
  bookingId,
  target,
  onComplete,
  existingRating,
  readOnly = false,
}: MutualRatingProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingRating?.review || "");

  const submitRatingMutation = useMutation({
    mutationFn: async (data: { rating: number; review: string }) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/bookings/${bookingId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId: target.id,
          targetType: target.type,
          rating: data.rating,
          review: data.review,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit rating");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      onComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitRatingMutation.mutate({ rating, review });
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {readOnly ? "Rating" : `Rate ${target.type === 'provider' ? 'Provider' : 'Customer'}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={target.imageUrl} alt={target.name} />
            <AvatarFallback className="bg-[hsl(24,100%,95%)] text-[hsl(24,100%,40%)]">
              {getInitials(target.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{target.name}</p>
            <p className="text-sm text-gray-500 capitalize">{target.type}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {readOnly ? "Rating" : "Your Rating"}
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && setRating(value)}
                onMouseEnter={() => !readOnly && setHoveredRating(value)}
                onMouseLeave={() => !readOnly && setHoveredRating(0)}
                className={`p-1 transition-transform ${
                  !readOnly && "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[hsl(24,100%,50%)] focus:ring-offset-2 rounded"
                }`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    value <= displayRating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {displayRating > 0 ? `${displayRating} star${displayRating !== 1 ? "s" : ""}` : "Select rating"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {readOnly ? "Review" : "Write a Review (Optional)"}
          </label>
          {readOnly ? (
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">
              {existingRating?.review || "No review provided"}
            </p>
          ) : (
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              className="resize-none"
              rows={4}
            />
          )}
        </div>

        {!readOnly && (
          <Button
            onClick={handleSubmit}
            disabled={submitRatingMutation.isPending || rating === 0}
            className="w-full bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
          >
            {submitRatingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Rating
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface StarRatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function StarRatingDisplay({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
}: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const starClass = sizeClasses[size];

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${starClass} ${
            value <= Math.round(rating)
              ? "text-yellow-400 fill-current"
              : "text-gray-300"
          }`}
        />
      ))}
      {showCount && (
        <span className="text-sm text-gray-500 ml-1">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}
