import React from "react";
import { Link } from "react-router-dom";

/**
 * A simple navigation bar displayed on the public/landing pages of the app.
 *
 * This component exposes links to the home page and search page.  On the
 * right‑hand side it renders actions for unauthenticated users: a link to
 * the login page and a prominent CTA for signing up.  It is intentionally
 * kept minimal to avoid exposing authenticated routes to guests.
 */
export default function GuestNavbar() {
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
              to="/"
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
          </div>
        </div>
        {/* Right side: authentication links */}
        <div className="flex items-center space-x-4">
          <Link
            to="/auth"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
          >
            Log in
          </Link>
          <Link
            to="/owner-signup"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}