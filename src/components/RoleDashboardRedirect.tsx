import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RoleDashboardRedirect() {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/auth/login" />;
  }

  if (role === "SUPPLIER") {
    return <Navigate replace to="/supplier/dashboard" />;
  }

  if (role === "OWNER") {
    return <Navigate replace to="/dashboard" />; // ✅ FIX
  }

  // 🔒 fallback safety
  return <Navigate replace to="/" />;
}