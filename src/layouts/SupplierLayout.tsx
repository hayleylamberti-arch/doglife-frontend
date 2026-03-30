import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ✅ REAL NAVBAR */}
      <SupplierNavbar />

      {/* ✅ CONTENT BELOW NAVBAR */}
      <div className="pt-20 p-6">
        <Outlet />
      </div>

    </div>
  );
}