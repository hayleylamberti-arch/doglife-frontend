import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function OwnerLayout() {
  return (
    <div>

      <Navbar />

      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>

    </div>
  );
}