import { Outlet, Link } from "react-router-dom";
import Brand from "@/components/Brand";

export default function GuestLayout() {
  return (
    <div>

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 py-4 border-b bg-white">
        <Brand />

        <div className="flex gap-4 text-sm">
          <Link to="/auth/login">Log in</Link>
          <Link to="/auth/register">Join DogLife</Link>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <Outlet />

    </div>
  );
}