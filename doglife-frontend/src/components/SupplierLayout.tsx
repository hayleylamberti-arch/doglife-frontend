import { Link, Outlet, useLocation } from "react-router-dom";

export default function SupplierLayout() {

  const location = useLocation();

  const navItems = [
    {
      label: "Dashboard",
      href: "/supplier-dashboard",
    },
    {
      label: "Bookings",
      href: "/supplier-bookings",
    },
    {
      label: "Public Profile",
      href: "/supplier-profile",
    },
    {
      label: "Edit Business Info",
      href: "/supplier-onboarding",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-[240px_1fr] gap-8">

      {/* Sidebar */}

      <aside className="space-y-4">

        <h2 className="text-xl font-semibold">
          Supplier
        </h2>

        <nav className="flex flex-col gap-2 text-sm">

          {navItems.map((item) => {

            const active = location.pathname === item.href;

            return (

              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-md transition ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {item.label}
              </Link>

            );

          })}

        </nav>

      </aside>

      {/* Page Content */}

      <main>
        <Outlet />
      </main>

    </div>
  );
}