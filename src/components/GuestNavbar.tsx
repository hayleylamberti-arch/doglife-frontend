import { Link } from "react-router-dom";
import Brand from "@/components/Brand";

export default function GuestNavbar() {
  return (
    <nav className="bg-white border-b fixed top-0 w-full z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">

        {/* LEFT */}
        <Brand />

        {/* RIGHT */}
        <div className="flex gap-4">
          <Link to="/auth">Log in</Link>
          <Link to="/join">Join DogLife</Link>
        </div>

      </div>
    </nav>
  );
}