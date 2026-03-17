import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function RoleDashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === "SUPPLIER") {
    return <Navigate to="/supplier-dashboard" replace />;
  }

  return <Navigate to="/owner-dashboard" replace />;
}