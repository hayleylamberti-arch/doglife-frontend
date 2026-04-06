import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Brand from "@/components/Brand";

export default function SupplierNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path)
      ? "text-black font-semibold"
      : "text-gray-600 hover:text-black";
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LEFT */}
        <div className="flex items-center space-x-8">

          <Brand />

          <div className="flex items-center space-x-6 text-sm">

            <Link
              to="/supplier/dashboard"
              className={isActive("/supplier/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              to="/supplier/profile"
              className={isActive("/supplier/profile")}
            >
              Business Profile
            </Link>

            <Link
              to="/supplier/services"
              className={isActive("/supplier/services")}
            >
              Services
            </Link>

            <Link
              to="/supplier/availability"
              className={isActive("/supplier/availability")}
            >
              Availability
            </Link>

          </div>
        </div>

        {/* RIGHT */}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}