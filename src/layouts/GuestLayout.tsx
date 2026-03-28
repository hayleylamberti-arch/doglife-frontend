import { Outlet } from "react-router-dom";
import AppNav from "@/components/AppNav";

export default function GuestLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
