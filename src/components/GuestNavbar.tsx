import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function GuestNavbar() {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">DogLife</span>
          </Link>

          <Link to="/" className="text-gray-700 hover:text-gray-900 hover:underline transition-colors">
            Home
          </Link>
          <Link to="/search" className="text-gray-700 hover:text-gray-900 hover:underline transition-colors">
            Search
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-gray-700 hover:text-gray-900 hover:underline transition-colors">
            Log in
          </Link>
          <Link to="/owner-signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Get started
          </Link>
        </div>

      </div>
    </nav>
  );
}
