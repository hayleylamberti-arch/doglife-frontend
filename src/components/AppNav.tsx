import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function AppNav() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();

  const dashboardPath = role === "SUPPLIER" ? "/supplier/dashboard" : "/owner/dashboard";
  const profilePath = role === "SUPPLIER" ? "/supplier/profile" : "/owner/profile";

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-semibold text-orange-500">
          DogLife
        </Link>

        {!isAuthenticated ? (
          <div className="flex items-center gap-5 text-sm">
            <Link to="/">Home</Link>
            <Link to="/auth/login">Login</Link>
            <Link className="font-medium text-orange-600" to="/auth/register">
              Join DogLife
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-5 text-sm">
            <Link to={dashboardPath}>Dashboard</Link>
            <Link to={profilePath}>Profile</Link>
            <button className="text-red-600" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
