import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";
import RoleNavbar from "@/components/RoleNavbar";

export default function AppLayout() {
  const {
    data: user,
    isLoading,
  } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavbar user={user ?? null} />
      <main className="mx-auto max-w-7xl p-6">
        {isLoading ? <div className="p-6">Loading...</div> : <Outlet />}
      </main>
    </div>
  );
}