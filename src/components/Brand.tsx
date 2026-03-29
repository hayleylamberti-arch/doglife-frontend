import { Link } from "react-router-dom";
import logo from "@/assets/doglife-logo.png";

export default function Brand() {
  return (
    <Link to="/" className="flex items-center space-x-3">
      
      {/* LOGO IMAGE */}
      <img
        src={logo}
        alt="DogLife logo"
        className="h-10 w-10 object-contain"
      />

      {/* TEXT */}
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold text-gray-900">
          DogLife
        </span>
        <span className="text-xs text-gray-500">
          Because they’re family
        </span>
      </div>

    </Link>
  );
}