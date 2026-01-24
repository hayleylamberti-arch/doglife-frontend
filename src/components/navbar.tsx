import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { useAuth } from "@hooks/useAuth";
import {
  Heart,
  Menu,
  User,
  Settings,
  LogOut,
  Search,
  Home,
  Calendar,
  Star,
  Users,
  BarChart3,
  MessageCircle,
  Shield,
  ExternalLink,
  Phone,
} from "lucide-react";
import { queryClient } from "@lib/queryClient";
import AuthModal from "@components/auth-modal";
import logoImage from "@assets/doglife-logo.jpeg";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");

      // Clear all cached data
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();

      // Manually clear cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });

      // POST logout request
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        console.log("Logout successful, redirecting...");
        window.location.replace("/");
      } else {
        console.error("Logout failed:", response.status);
        window.location.replace("/api/auth/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      window.location.replace("/api/auth/login");
    }
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { href: "/", label: "Home", icon: Home },
      { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    ];

    if (user?.userType === "provider") {
      return [
        ...baseItems,
        { href: "/find-clients", label: "Find Clients", icon: Search },
        { href: "/messages", label: "Messages", icon: MessageCircle },
        { href: "/subscription", label: "Membership", icon: Star },
        { href: "/profile", label: "Profile", icon: User },
      ];
    } else {
      return [
        ...baseItems,
        { href: "/service-flow", label: "Book Service", icon: Calendar },
        { href: "/search", label: "Find Services", icon: Search },
        { href: "/providers", label: "Providers", icon: Users },
        ...(user?.subscriptionType === "owner_plus"
          ? [{ href: "/emergency", label: "Emergency", icon: Phone }]
          : []),
        { href: "/messages", label: "Messages", icon: MessageCircle },
        { href: "/subscription", label: "Membership", icon: Star },
        { href: "/profile", label: "Profile", icon: User },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  if (user?.userType === "admin") {
    navigationItems.splice(-1, 0, {
      href: "/admin-dashboard",
      label: "Admin",
      icon: Shield,
    });
  }

  return (
    <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logoImage} alt="DogLife" className="h-10 w-10 mr-2" />
            <span className="font-bold text-xl text-gray-900">DogLife</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.profileImageUrl || ""}
                        alt={user.firstName || ""}
                      />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.firstName?.[0] || user.email?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/search" className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      <span>Find Services</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/new-account" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Create New Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {isAuthenticated && user && (
                    <div className="flex items-center space-x-3 pb-4 border-b">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.profileImageUrl || ""}
                          alt={user.firstName || ""}
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {user.firstName?.[0] || user.email?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {navigationItems.map((item) => (
                    <Button
                      key={item.href}
                      asChild
                      variant={
                        location.pathname === item.href ? "default" : "ghost"
                      }
                      className="justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}

                  {isAuthenticated ? (
                    <Button
                      variant="ghost"
                      className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowAuthModal(true);
                      }}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />
    </header>
  );
}