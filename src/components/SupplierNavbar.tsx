import React from "react";
import { Link } from "react-router-dom";

export default function SupplierNavbar() {
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch (err) {
      // ignore errors
    }
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* LEFT SIDE */}
        <div className="flex items-center space-x-8">

          {/* ✅ BRAND (FIXED) */}
          <div className="flex flex-col leading-tight">
            <Link
              to="/supplier-dashboard"
              className="text-xl font-semibold text-orange-500 whitespace-nowrap"
            >
              DogLife
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Because they’re family
            </span>
          </div>

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

        {/* RIGHT SIDE */}
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