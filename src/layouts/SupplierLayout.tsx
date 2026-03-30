import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* 🔥 TEMP: comment this out for debugging */}
      {/* <SupplierNavbar /> */}

      <div className="p-6">
        <Outlet />
      </div>

    </div>
  );
}