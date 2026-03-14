import { Outlet } from "react-router-dom";
import RoleNavbar from "@/components/RoleNavbar";

export default function OwnerLayout() {
  return (
    <div>

     <RoleNavbar /> 

      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>

    </div>
  );
}