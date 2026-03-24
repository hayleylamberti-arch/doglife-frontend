import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SupplierProtectedRoute() {
  const { user, isLoading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.get("/api/supplier/profile");

        // safer check
        if (res.data && Object.keys(res.data).length > 0) {
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch {
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (user?.role === "SUPPLIER") {
      checkProfile();
    } else {
      setCheckingProfile(false);
    }
  }, [user]);

  /* ===============================
     AUTH LOADING
  =============================== */

  if (isLoading || checkingProfile) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  /* ===============================
     NOT LOGGED IN
  =============================== */

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  /* ===============================
     WRONG ROLE
  =============================== */

  if (user.role !== "SUPPLIER") {
    return <Navigate to="/dashboard" replace />;
  }

  /* ===============================
     NO PROFILE → onboarding
  =============================== */

  if (!hasProfile) {
    return <Navigate to="/supplier-onboarding" replace />;
  }

  /* ===============================
     SUCCESS → render nested routes
  =============================== */

  return <Outlet />;
}