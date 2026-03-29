import React from "react";
import { Link } from "react-router-dom";
import Brand from "@/components/Brand";

export default function SupplierNavbar() {
  const handleLogout = () => {
    try {
     localStorage.removeItem("token");
localStorage.removeItem("authToken"); 
    } catch (err) {}
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* LEFT: BRAND + NAV */}
        <div className="flex items-center space-x-8">

          {/* ✅ BRAND (NEW) */}
          <Brand />

          {/* NAV LINKS */}
          <div className="flex items-center space-x-4">
            <Link
              to="/supplier-dashboard"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              Dashboard
            </Link>

            <Link
              to="/supplier-profile"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              Profile
            </Link>

            <Link
              to="/supplier-onboarding"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              Edit Business Info
            </Link>
          </div>
        </div>

        {/* RIGHT: LOGOUT */}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}