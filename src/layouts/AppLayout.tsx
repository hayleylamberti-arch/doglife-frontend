import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";
import RoleNavbar from "@/components/RoleNavbar";

export default function AppLayout() {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 👇 PASS USER INTO NAVBAR */}
      <RoleNavbar user={user} />

      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}