import { Star } from "lucide-react";

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}

export default function Rating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  onRatingChange,
  readonly = true
}: RatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const handleStarClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          const isHalfFilled = starValue - 0.5 <= rating && starValue > rating;

          return (
            <button
              key={index}
              type="button"
              className={`${
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
              } transition-transform`}
              onClick={() => handleStarClick(starValue)}
              disabled={readonly}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled || isHalfFilled
                    ? "text-doglife-secondary fill-current"
                    : "text-gray-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${
          size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
        } text-doglife-neutral font-medium`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
