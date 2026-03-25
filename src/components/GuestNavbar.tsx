import { Link } from "react-router-dom";

export default function GuestNavbar() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold">
            DogLife
          </Link>
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/search" className="hover:underline">
            Search
          </Link>
          <Link to="/auth" className="hover:underline">
            Log in
          </Link>
          <Link to="/owner-signup" className="hover:underline">
            Get started
          </Link>
        </div>

      </div>
    </nav>
  );
}
