import { Link, Outlet } from "react-router-dom";

export default function SupplierLayout() {
  return (
    <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-[240px_1fr] gap-8">

      <aside className="space-y-4">

        <h2 className="text-xl font-semibold">
          Supplier
        </h2>

        <nav className="flex flex-col gap-2 text-sm">

          <Link
            to="/supplier-dashboard"
            className="px-3 py-2 rounded-md hover:bg-gray-100"
          >
            Dashboard
          </Link>

          <Link
            to="/supplier-onboarding"
            className="px-3 py-2 rounded-md hover:bg-gray-100"
          >
            Edit Business Info
          </Link>

          <Link
            to="/supplier-profile"
            className="px-3 py-2 rounded-md hover:bg-gray-100"
          >
            Public Profile
          </Link>

        </nav>

      </aside>

      <main>
        <Outlet />
      </main>

    </div>
  );
}