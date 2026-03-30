import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "@/components/Brand";

export default function SupplierNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    navigate("/"); // cleaner than window.location
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LEFT */}
        <div className="flex items-center space-x-8">

          {/* BRAND */}
          <Brand />

          {/* NAV */}
          <div className="flex items-center space-x-4">
            <Link
              to="/supplier/dashboard"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Dashboard
            </Link>

            <Link
              to="/supplier/profile"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Profile
            </Link>

            <Link
              to="/supplier/profile"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Edit Business Info
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}