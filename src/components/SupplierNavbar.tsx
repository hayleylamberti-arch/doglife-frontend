import React from "react";
import { Link } from "react-router-dom";

/**
 * Navigation bar for suppliers/business owners.  This navbar is shown on
 * pages within the supplier dashboard.  It provides links to the
 * supplier dashboard, their profile page and an onboarding page where
 * business details can be edited.  A logout button is included to clear
 * the authentication token and return to the landing page.
 */
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
    <nav
      className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left side: brand and primary navigation */}
        <div className="flex items-center space-x-6">
          <Link
            to="/supplier-dashboard"
            className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap"
          >
            DogLife
          </Link>
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
        {/* Right side: logout */}
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