import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";

export default function SupplierLayout() {
  return (
    <div>
      <SupplierNavbar />

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}