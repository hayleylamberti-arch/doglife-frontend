import { useQuery } from "@tanstack/react-query";
import type { User } from "@/../../shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 0, // Always check for fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on component mount
  });

  // Add computed properties for compatibility
  const userWithComputedProps = user ? {
    ...user,
    isExpired: user.subscriptionExpiry ? new Date(user.subscriptionExpiry) < new Date() : false,
  } : undefined;

  // Consider user unauthenticated if there's an error or no user data
  const isAuthenticated = !!user && !error;

  return {
    user: userWithComputedProps,
    isLoading,
    isAuthenticated,
    error,
  };
}
