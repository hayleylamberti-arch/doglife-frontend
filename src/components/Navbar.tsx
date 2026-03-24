import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Brand from "@/components/Brand";
import { Home, Search, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ================================
     AUTH (FIXED)
  ================================ */
  const { token, logout } = useAuth();

  const navItems = [
    { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
    { label: "Search", href: "/search", icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Brand />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  location.pathname === item.href
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {/* ================================
              AUTH BUTTONS (FIXED)
          ================================ */}
          <div className="hidden md:flex items-center space-x-3">
            {!token ? (
              <>
                <Link to="/auth" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>

                <Link to="/auth">
                  <Button>Join DogLife</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>

                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:underline"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* ================================
            MOBILE MENU (FIXED)
        ================================ */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">

            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {!token ? (
              <>
                <Link
                  to="/auth"
                  className="block px-4 py-2 text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>

                <div className="px-4">
                  <Link to="/auth">
                    <Button className="w-full">Join DogLife</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            )}

          </div>
        )}

      </div>
    </nav>
  );
}