import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await api.get("/api/admin/users");
      return res.data;
    },
  });

  if (isLoading) return <div className="p-6">Loading users...</div>;

  if (error || !data?.ok) {
    return <div className="p-6 text-red-600">Unable to load users.</div>;
  }

  const users: AdminUser[] = data.users ?? [];

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-gray-500">View DogLife owner, supplier and admin accounts.</p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(user.createdAt).toLocaleDateString("en-ZA")}
                </td>
              </tr>
            ))}

            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}