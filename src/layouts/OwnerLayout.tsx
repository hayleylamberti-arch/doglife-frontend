import { Outlet } from "react-router-dom";
import OwnerNavbar from "@/components/OwnerNavbar";
import Footer from "@/components/Footer";

export default function OwnerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* NAVBAR */}
      <OwnerNavbar />

      {/* PAGE CONTENT */}
      <main className="pt-20 px-4 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}