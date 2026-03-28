import { Outlet } from "react-router-dom";
import GuestNavbar from "@/components/GuestNavbar";

export default function GuestLayout() {
  return (
    <div>
      <GuestNavbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}