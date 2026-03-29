import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link to="/" className="flex flex-col leading-tight">
      <span className="text-xl font-semibold text-gray-900 dark:text-white">
        DogLife
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Because they’re family
      </span>
    </Link>
  );
}