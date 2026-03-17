import { Link } from "react-router-dom";

export default function SupplierNavbar() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">

        <Link to="/supplier-dashboard" className="font-semibold">
          DogLife
        </Link>

        <Link to="/supplier-dashboard">
          Dashboard
        </Link>

        <Link to="/supplier-profile">
          Profile
        </Link>

        <Link to="/supplier-onboarding">
          Edit Business Info
        </Link>

      </div>
    </nav>
  );
}