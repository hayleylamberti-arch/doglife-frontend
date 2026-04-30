import { useState } from "react";
import { Link } from "react-router-dom";
import Brand from "./Brand";

export default function RoleNavbar({ user }: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const ownerLinks = [
    { to: "/search", label: "Search" },
    { to: "/owner/dashboard", label: "My Dashboard" },
    { to: "/owner/my-dogs", label: "My Dogs" },
    { to: "/owner/profile", label: "Profile" },
  ];

  const supplierLinks = [
    { to: "/supplier/dashboard", label: "Dashboard" },
    { to: "/supplier/services", label: "Services" },
    { to: "/supplier/profile", label: "Profile" },
    { to: "/supplier/availability", label: "Availability" },
  ];

  const guestLinks = [
    { to: "/search", label: "Search" },
    { to: "/auth/login", label: "Log in" },
    { to: "/auth/register", label: "Join DogLife" },
  ];

  const links =
    user?.role === "OWNER"
      ? ownerLinks
      : user?.role === "SUPPLIER"
      ? supplierLinks
      : guestLinks;

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeMenu}>
            <Brand />
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-gray-700 hover:underline"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-red-500"
              >
                Logout
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 md:hidden"
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-3 border-t pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-left text-base font-medium text-red-500 hover:bg-gray-100"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}