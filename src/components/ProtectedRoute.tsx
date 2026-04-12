import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  // ⏳ Wait for auth to load FIRST
  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // 🚫 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // ✅ Logged in
  return <>{children}</>;
}