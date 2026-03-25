import { Outlet } from "react-router-dom";
import RoleNavbar from "@/components/RoleNavbar";

export default function AppLayout() {
  // Force recompile - change 124
  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{backgroundColor: 'red', padding: '20px', fontSize: '24px', fontWeight: 'bold'}}>
        THIS IS THE APPLAYOUT - IF YOU SEE THIS, RoleNavbar is not working
      </div>
      <RoleNavbar />
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
