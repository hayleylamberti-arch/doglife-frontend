import Brand from "./Brand";

export default function RoleNavbar({ user }: any) {
  console.log("RoleNavbar user:", user);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center">
            <Brand />
          </a>

          <a href="/" className="hover:underline text-gray-700">
            Home
          </a>

          <a href="/search" className="hover:underline text-gray-700">
            Search
          </a>

          {/* 👇 NOT LOGGED IN */}
          {!user && (
            <>
              <a href="/auth" className="hover:underline text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                Log in
              </a>

              <a href="/owner-signup" className="hover:underline text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                Join DogLife
              </a>
            </>
          )}

          {/* 👇 OWNER NAV */}
          {user?.role === "OWNER" && (
            <>
              <a href="/dashboard" className="hover:underline text-gray-700">
                My Dashboard
              </a>

              <a href="/my-dogs" className="hover:underline text-gray-700">
                My Dogs
              </a>

              <a href="/profile" className="hover:underline text-gray-700">
                Profile
              </a>
            </>
          )}

          {/* 👇 SUPPLIER NAV */}
          {user?.role === "SUPPLIER" && (
            <>
              <a href="/supplier-dashboard" className="hover:underline text-gray-700">
                Dashboard
              </a>

              <a href="/supplier-services" className="hover:underline text-gray-700">
                Services
              </a>

              <a href="/supplier-profile" className="hover:underline text-gray-700">
                Profile
              </a>
            </>
          )}
        </div>

        {/* 👇 LOGOUT (if logged in) */}
        {user && (
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="text-red-500 font-medium"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}