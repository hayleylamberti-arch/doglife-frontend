import { Outlet } from "react-router-dom";
import OwnerNavbar from "@/components/OwnerNavbar";

export default function OwnerLayout() {
  return (
    <div>

      <OwnerNavbar />

      <main className="pt-20 px-6">
        <Outlet />
      </main>

    </div>
  );
}