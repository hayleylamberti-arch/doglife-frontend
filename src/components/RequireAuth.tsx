import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  allowRoles?: string[];
};

export default function RequireAuth({ allowRoles }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowRoles && (!user || !allowRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}