import { Outlet } from "react-router-dom";
import RoleNavbar from "@/components/RoleNavbar";

export default function OwnerLayout() {
  return (
    <div>
      <RoleNavbar />
      <Outlet /> {/* 🔥 THIS IS CRITICAL */}
    </div>
  );
}