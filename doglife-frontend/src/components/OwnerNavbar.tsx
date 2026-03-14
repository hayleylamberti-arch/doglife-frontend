import { Link } from "react-router-dom";

export default function OwnerNavbar() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">

        <Link to="/" className="font-semibold">
          DogLife
        </Link>

        <Link to="/dashboard">Home</Link>

        <Link to="/search">Search</Link>

        <Link to="/my-dogs">My Dogs</Link>

        <Link to="/profile">Profile</Link>

      </div>
    </nav>
  );
}