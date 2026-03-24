import { Outlet } from "react-router-dom";
import OwnerNavbar from "@/components/OwnerNavbar";

export default function OwnerLayout() {
  return (
    <div>
      <OwnerNavbar />
      <Outlet /> {/* 🔥 THIS IS CRITICAL */}
    </div>
  );
}