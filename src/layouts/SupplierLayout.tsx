import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <SupplierNavbar />

      {/* 🔥 THIS LINE IS EVERYTHING */}
      <div className="p-6">
        <Outlet />
      </div>

    </div>
  );
}