import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function GuestNavbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b">
      
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Logo className="h-10 w-auto" />
        <span className="text-sm text-gray-500">
          Because they’re family
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <Link to="/auth/login" className="text-gray-700 hover:text-black font-medium">
          Log in
        </Link>

        <Link to="/auth/register" className="bg-black text-white px-4 py-2 rounded-lg font-medium">
          Join DogLife
        </Link>
      </div>
    </nav>
  );
}