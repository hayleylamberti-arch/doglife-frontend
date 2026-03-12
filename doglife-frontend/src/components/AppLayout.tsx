import { Outlet, Link } from "react-router-dom";
import Brand from "@/components/Brand";
import { useAuth } from "@/hooks/use-auth";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <Brand />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6 text-sm font-medium">
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

        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 text-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 flex justify-between">

          <div>
            <p className="font-semibold">DogLife</p>
            <p className="text-muted-foreground">
              Connecting dog owners with trusted service providers.
            </p>
          </div>

          <div className="flex gap-4">
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