import SupplierNavbar from "@/components/SupplierNavbar";
import { Outlet } from "react-router-dom";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SupplierNavbar />
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}