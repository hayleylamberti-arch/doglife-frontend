import React from "react";
import { Link } from "react-router-dom";

/**
 * Navigation bar for dog owners.  Once a user is authenticated as an
 * owner they will see this navbar on their dashboard pages.  It exposes
 * routes relevant to pet owners: their dashboard, search, a list of
 * registered dogs and their personal profile.  A logout button is
 * included on the right which clears the auth token and returns the
 * user back to the landing page.
 */
export default function OwnerNavbar() {
  /**
   * Clears the JWT/token from localStorage and forces a full page
   * navigation back to the landing page.  We avoid using the
   * history API here to guarantee a clean reload state after logout.
   */
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch (err) {
      // ignore errors – localStorage may not be available in some contexts
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
            to="/"
            className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap"
          >
            DogLife
          </Link>
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