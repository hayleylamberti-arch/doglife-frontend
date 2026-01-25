import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "btn-primary",
        primary: "btn-primary", 
        secondary: "btn-secondary",
        accent: "btn-accent",
        ghost: "btn-ghost",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2 text-base",
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2 text-base", 
        lg: "px-6 py-3 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  rounded?: "md" | "full";
  loading?: boolean;
}

export { buttonVariants };

export function Button({
  className,
  variant = "primary",
  size = "md", 
  rounded = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const roundedClasses = {
    md: "rounded-md",
    full: "rounded-full",
  };

  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        roundedClasses[rounded],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live={loading ? "polite" : undefined}
      {...props}
    >
      {/* Spinner */}
      {loading && (
        <svg
          className={cn(
            "animate-spin -ml-1 mr-2",
            size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
            variant === "ghost" ? "text-doglife-primary" : "text-white"
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="status"
          aria-label="loading"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}

      {/* Content with subtle shift so text doesn't jump when spinner appears */}
      <span className={cn(loading ? "translate-y-px" : "")}>{children}</span>
    </button>
  );
}