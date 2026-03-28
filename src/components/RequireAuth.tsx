import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/hooks/useAuth";

interface RequireAuthProps {
  allowRoles?: UserRole[];
}

export default function RequireAuth({ allowRoles }: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowRoles && role && !allowRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
