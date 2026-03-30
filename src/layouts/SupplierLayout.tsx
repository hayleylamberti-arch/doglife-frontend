import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <SupplierNavbar />

      {/* PAGE CONTENT */}
      <main className="p-6">
        <Outlet /> {/* 🔥 THIS IS THE FIX */}
      </main>

    </div>
  );
}