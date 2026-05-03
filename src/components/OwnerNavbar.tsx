import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Brand from "@/components/Brand";
import { api } from "@/lib/api";

export default function OwnerNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data;
    },
  });

  const unreadCount = notificationsData?.unreadCount || 0;

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
    } catch (err) {
      console.error("Failed to clear auth token", err);
    }

    window.location.href = "/";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/owner/dashboard" onClick={closeMobileMenu}>
            <Brand />
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link to="/owner/dashboard" className="text-sm font-medium text-gray-700 hover:underline dark:text-gray-300">
              Home
            </Link>

            <Link to="/search" className="text-sm font-medium text-gray-700 hover:underline dark:text-gray-300">
              Search
            </Link>

            <Link to="/owner/my-dogs" className="text-sm font-medium text-gray-700 hover:underline dark:text-gray-300">
              My Dogs
            </Link>

            <Link to="/owner/profile" className="text-sm font-medium text-gray-700 hover:underline dark:text-gray-300">
              Profile
            </Link>

            <Link to="/owner/notifications" className="relative text-sm font-medium text-gray-700 hover:underline dark:text-gray-300">
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>

            <button type="button" onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline dark:text-red-400">
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 md:hidden dark:border-gray-600 dark:text-gray-200"
            aria-label="Toggle owner menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-3 border-t border-gray-200 pt-3 md:hidden dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <Link to="/owner/dashboard" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                Home
              </Link>

              <Link to="/search" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                Search
              </Link>

              <Link to="/owner/my-dogs" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                My Dogs
              </Link>

              <Link to="/owner/profile" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                Profile
              </Link>

              <Link to="/owner/notifications" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
              </Link>

              <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700">
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}