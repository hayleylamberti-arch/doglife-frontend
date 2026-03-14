import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  children: React.ReactNode;
}

export default function SupplierProtectedRoute({ children }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "SUPPLIER") {
    return <Navigate to="/supplier-onboarding" replace />;
  }

  return <>{children}</>;
}