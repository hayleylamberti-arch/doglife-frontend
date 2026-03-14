import { Link, useLocation } from "react-router-dom";
import Brand from "@/components/Brand";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Search,
  User,
  LogOut,
  Menu,
  LayoutDashboard,
  Dog
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  role?: "owner" | "supplier";
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
  { label: "Search", href: "/search", icon: <Search className="h-4 w-4" /> },

  {
    label: "Dashboard",
    href: "/supplier-dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    requiresAuth: true,
    role: "supplier",
  },

  {
    label: "My Dogs",
    href: "/my-dogs",
    icon: <Dog className="h-4 w-4" />,
    requiresAuth: true,
    role: "owner",
  },

  {
    label: "Profile",
    href: "/profile",
    icon: <User className="h-4 w-4" />,
    requiresAuth: true,
  },
];

export default function Navbar() {

  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => {

    if (item.requiresAuth && !isAuthenticated) return false;

   if (item.role && (user as any)?.role !== item.role) return false; 

    return true;

  });

  const getInitials = (firstName?: string, lastName?: string): string => {

    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";

    return (first + last).toUpperCase() || "U";

  };

  return (

    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">

      <div className="container mx-auto px-4">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}

          <Link to="/" className="flex items-center">
            <Brand />
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden md:flex items-center space-x-1">

            {filteredNavItems.map((item) => (

              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "bg-[hsl(24,100%,95%)] text-[hsl(24,100%,40%)]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>

            ))}

          </div>

          {/* User Menu */}

          <div className="hidden md:flex items-center space-x-4">

            {isAuthenticated && user ? (

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">

                    <Avatar className="h-10 w-10">

                      <AvatarImage src={user.profileImageUrl} />

                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>

                    </Avatar>

                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">

                  <div className="px-2 py-1.5">

                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>

                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>

                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>

                    <Link to="/profile">

                      <User className="mr-2 h-4 w-4" />
                      Profile

                    </Link>

                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-red-600"
                  >

                    <LogOut className="mr-2 h-4 w-4" />
                    Log out

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

            ) : (

              <Link to="/auth">

                <Button className="bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white">
                  Sign In
                </Button>

              </Link>

            )}

          </div>

          {/* Mobile Menu Button */}

          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

        </div>

        {/* Mobile Navigation */}

        {mobileMenuOpen && (

          <div className="md:hidden py-4 border-t">

            {filteredNavItems.map((item) => (

              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
              >

                {item.icon}
                <span>{item.label}</span>

              </Link>

            ))}

          </div>

        )}

      </div>

    </nav>

  );

}