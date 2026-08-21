import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RoleDashboardRedirect() {
  const { role, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (role === "SUPPLIER") {
      navigate("/supplier/dashboard", { replace: true });
    } else if (role === "OWNER") {
      navigate(
        user?.onboardingCompleted
          ? "/owner/dashboard"
          : "/owner/onboarding",
        { replace: true }
      );
    } else if (role === "ADMIN") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [role, user?.onboardingCompleted, isLoading, navigate]);

  return <div className="p-6">Redirecting...</div>;
}