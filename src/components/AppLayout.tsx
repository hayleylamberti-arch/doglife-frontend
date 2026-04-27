import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import Brand from "@/components/Brand";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    setMobileMenuOpen(false);
    logout();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
            <Brand />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>

            <Link to="/search" className="hover:text-primary">
              Search
            </Link>

            <Link to="/suppliers" className="hover:text-primary">
              Providers
            </Link>

            {user && (
              <>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>

                <Link to="/my-dogs" className="hover:text-primary">
                  My Dogs
                </Link>

                <Link to="/profile" className="hover:text-primary">
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Logout
                </button>
              </>
            )}

            {!user && (
              <Link to="/auth" className="text-primary font-semibold">
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Burger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex md:hidden items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen ? (
          <nav className="border-t bg-white px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 text-base font-medium">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="rounded-md px-2 py-2 hover:bg-muted"
              >
                Home
              </Link>

              <Link
                to="/search"
                onClick={closeMobileMenu}
                className="rounded-md px-2 py-2 hover:bg-muted"
              >
                Search
              </Link>

              <Link
                to="/suppliers"
                onClick={closeMobileMenu}
                className="rounded-md px-2 py-2 hover:bg-muted"
              >
                Providers
              </Link>

              {user && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="rounded-md px-2 py-2 hover:bg-muted"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/my-dogs"
                    onClick={closeMobileMenu}
                    className="rounded-md px-2 py-2 hover:bg-muted"
                  >
                    My Dogs
                  </Link>

                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="rounded-md px-2 py-2 hover:bg-muted"
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md px-2 py-2 text-left text-muted-foreground hover:bg-muted hover:text-primary"
                  >
                    Logout
                  </button>
                </>
              )}

              {!user && (
                <Link
                  to="/auth"
                  onClick={closeMobileMenu}
                  className="rounded-md px-2 py-2 font-semibold text-primary hover:bg-muted"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 text-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-4 md:flex-row md:justify-between">
          <div>
            <p className="font-semibold">DogLife</p>
            <p className="text-muted-foreground">
              Connecting dog owners with trusted service providers.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <Link to="/search" className="hover:text-primary">
              Search
            </Link>
            <Link to="/suppliers" className="hover:text-primary">
              Providers
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}