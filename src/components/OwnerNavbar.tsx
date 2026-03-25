import { Link } from "react-router-dom";

export default function OwnerNavbar() {

  const handleLogout = () => {
    localStorage.removeItem("token"); // 🔑 clear auth
    window.location.href = "/";       // 🔄 force reset app state
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold">
            DogLife
          </Link>

          <Link to="/dashboard">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/my-dogs">My Dogs</Link>
          <Link to="/profile">Profile</Link>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}