import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface Props {
  children: React.ReactNode;
}

export default function SupplierProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.get("/api/supplier/profile");
        setHasProfile(!!res.data);
      } catch {
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!hasProfile) {
    return <Navigate to="/supplier-onboarding" replace />;
  }

  return <>{children}</>;
}