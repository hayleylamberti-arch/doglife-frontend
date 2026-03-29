import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div>
      {/* NAVBAR */}
      <SupplierNavbar />

      {/* PAGE CONTENT */}
      <div className="pt-20 px-4">
        <Outlet />
      </div>
    </div>
  );
}