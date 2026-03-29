import React from "react";
import { Link } from "react-router-dom";
import Brand from "@/components/Brand";

/**
 * Navigation bar for dog owners.
 */
export default function OwnerNavbar() {
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

          {/* ✅ BRAND (UPDATED) */}
          <Brand />

          {/* NAV LINKS */}
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              Home
            </Link>

            <Link
              to="/search"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              Search
            </Link>

            <Link
              to="/my-dogs"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              My Dogs
            </Link>

            <Link
              to="/profile"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
            >
              Profile
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