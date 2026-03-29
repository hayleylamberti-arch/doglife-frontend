import { Outlet } from "react-router-dom";
import OwnerNavbar from "@/components/OwnerNavbar";

export default function OwnerLayout() {
  return (
    <div>

      {/* NAVBAR */}
      <OwnerNavbar />

      {/* PAGE CONTENT */}
      <main className="pt-20 px-4">
        <Outlet />
      </main>

    </div>
  );
}