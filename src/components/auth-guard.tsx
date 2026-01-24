// client/src/components/auth-guard.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

type Props = { children: ReactNode };

export default function AuthGuard({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // object: { pathname, search, ... }

  if (isLoading) return null; // or a spinner

  if (!isAuthenticated) {
    // send them to landing (or /auth) and keep where they came from
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}