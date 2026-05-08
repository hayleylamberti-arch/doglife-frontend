import { Outlet, Link } from "react-router-dom";
import Brand from "@/components/Brand";
import Footer from "@/components/Footer";

export default function GuestLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
        {/* LEFT: BRAND */}
        <Brand />

        {/* RIGHT: LINKS */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            to="/auth/login"
            className="text-gray-700 hover:underline"
          >
            Log in
          </Link>

          <Link
            to="/auth/register"
            className="text-black font-medium"
          >
            Join DogLife
          </Link>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}