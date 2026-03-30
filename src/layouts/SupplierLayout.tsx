import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <SupplierNavbar />

      {/* 🔥 THIS IS THE FIX */}
      <main className="p-4">
        <Outlet />
      </main>

    </div>
  );
}