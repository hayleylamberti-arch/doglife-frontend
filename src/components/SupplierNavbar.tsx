import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function SupplierNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // send user back to landing page
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left side */}
        <div className="flex items-center gap-6">
          <Link to="/supplier-dashboard" className="font-semibold">
            DogLife
          </Link>

          <Link to="/supplier-dashboard">
            Dashboard
          </Link>

          <Link to="/supplier-profile">
            Profile
          </Link>

          <Link to="/supplier-onboarding">
            Edit Business Info
          </Link>
        </div>

        {/* Right side */}
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 hover:underline"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}