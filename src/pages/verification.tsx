import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import VerificationStatus from "@/components/verification-status";

export default function VerificationPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Verification
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your email verification status
          </p>
        </div>
        
        <VerificationStatus />
      </div>
    </div>
  );
}