import { Outlet } from "react-router-dom";
import SupplierNavbar from "@/components/SupplierNavbar";
import Footer from "@/components/Footer";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* NAVBAR */}
      <SupplierNavbar />

      {/* CONTENT BELOW NAVBAR */}
      <main className="pt-20 p-6 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}