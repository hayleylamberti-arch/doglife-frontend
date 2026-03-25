import { Outlet } from "react-router-dom";
import RoleNavbar from "@/components/RoleNavbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavbar />
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
