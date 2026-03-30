import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({
  allowRoles,
}: {
  allowRoles?: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 🔄 Wait for auth to load
  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // 🔒 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 🚫 Wrong role
  if (allowRoles && user && !allowRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ THIS IS THE MOST IMPORTANT LINE
  return <Outlet />;
}