import Brand from "./Brand";

export default function RoleNavbar() {
  console.log("RoleNavbar is rendering!");
  return (
    <nav className="border-b bg-red-100">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center">
            <Brand />
          </a>
          <span className="text-red-600 font-bold">FIXED NAVBAR</span>
          <a href="/" className="hover:underline text-gray-700">
            Home
          </a>
          <a href="/search" className="hover:underline text-gray-700">
            Search
          </a>
          <a href="/auth" className="hover:underline text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
            Log in
          </a>
          <a href="/owner-signup" className="hover:underline text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
            Get started
          </a>
        </div>
      </div>
    </nav>
  );
}