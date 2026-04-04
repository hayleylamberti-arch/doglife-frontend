import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  allowRoles?: ("OWNER" | "SUPPLIER" | "ADMIN")[];
};

export default function RequireAuth({ allowRoles }: Props) {
  const { token, role, isLoading } = useAuth();
  const location = useLocation();

  // ✅ 1. WAIT for auth to load
  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // ✅ 2. Check token (NOT user)
  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // ✅ 3. Check role safely
  if (allowRoles && role && !allowRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ 4. Allow access
  return <Outlet />;
}