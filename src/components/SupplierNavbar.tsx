import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Brand from "@/components/Brand";
import { api } from "@/lib/api";

export default function SupplierNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
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
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    handleLogout();
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path)
      ? "text-black font-semibold"
      : "text-gray-600 hover:text-black";
  };

  const mobileLinkClass = (path: string) => {
    return location.pathname.includes(path)
      ? "rounded-md bg-gray-100 px-3 py-2 text-base font-semibold text-black"
      : "rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100";
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-screen-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/supplier/dashboard" onClick={closeMobileMenu}>
            <Brand />
          </Link>

          <div className="hidden items-center gap-6 text-sm md:flex">
            <Link to="/supplier/dashboard" className={isActive("/supplier/dashboard")}>
              Dashboard
            </Link>

            <Link to="/supplier/profile" className={isActive("/supplier/profile")}>
              Business Profile
            </Link>

            <Link to="/supplier/services" className={isActive("/supplier/services")}>
              Services
            </Link>

            <Link to="/supplier/availability" className={isActive("/supplier/availability")}>
              Availability
            </Link>

            <Link
              to="/supplier/notifications"
              className={isActive("/supplier/notifications")}
            >
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 md:hidden"
            aria-label="Toggle supplier menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-3 border-t border-gray-200 pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                to="/supplier/dashboard"
                onClick={closeMobileMenu}
                className={mobileLinkClass("/supplier/dashboard")}
              >
                Dashboard
              </Link>

              <Link
                to="/supplier/profile"
                onClick={closeMobileMenu}
                className={mobileLinkClass("/supplier/profile")}
              >
                Business Profile
              </Link>

              <Link
                to="/supplier/services"
                onClick={closeMobileMenu}
                className={mobileLinkClass("/supplier/services")}
              >
                Services
              </Link>

              <Link
                to="/supplier/availability"
                onClick={closeMobileMenu}
                className={mobileLinkClass("/supplier/availability")}
              >
                Availability
              </Link>

              <Link
                to="/supplier/notifications"
                onClick={closeMobileMenu}
                className={mobileLinkClass("/supplier/notifications")}
              >
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
              </Link>

              <button
                type="button"
                onClick={handleMobileLogout}
                className="rounded-md px-3 py-2 text-left text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}