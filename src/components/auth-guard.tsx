import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredUserType?: "owner" | "provider" | "admin";
  fallbackPath?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requiredUserType,
  fallbackPath = "/auth",
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(24,100%,50%)]" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (
    requiredUserType &&
    (user as any)?.role !== requiredUserType.toUpperCase()
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/* Convenience Guards                                                         */
/* -------------------------------------------------------------------------- */

export function OwnerGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth requiredUserType="owner">
      {children}
    </AuthGuard>
  );
}

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth requiredUserType="provider">
      {children}
    </AuthGuard>
  );
}
