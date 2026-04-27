import { useState } from "react";
import { Link } from "react-router-dom";
import Brand from "@/components/Brand";

export default function GuestNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeMobileMenu}>
            <Brand />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/auth"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Log in
            </Link>

            <Link
              to="/join"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Join DogLife
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 md:hidden"
            aria-label="Toggle guest menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen ? (
          <div className="mt-3 border-t border-gray-200 pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                to="/auth"
                onClick={closeMobileMenu}
                className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Log in
              </Link>

              <Link
                to="/join"
                onClick={closeMobileMenu}
                className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Join DogLife
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}