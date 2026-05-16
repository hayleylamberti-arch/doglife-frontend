import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type UserInsight = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  lastLoginAt?: string | null;
  lastBookingAt?: string | null;
  isActive: boolean;
  activityStatus: string;
  ownerBookingCount: number;
  supplierBookingCount: number;
  totalBookingCount: number;
  ownerSpendCents: number;
  supplierRevenueCents: number;
  topService?: string | null;
  topSuburb?: string | null;
  supplierProfile?: {
    businessName?: string | null;
    suburb?: string | null;
    approvalStatus?: string;
    isPublicVisible?: boolean;
    ratingAverage?: number;
    ratingCount?: number;
    services?: string[];
  } | null;
};

type UsersInsightsResponse = {
  ok: boolean;
  users: UserInsight[];
  marketplace?: {
    mostBookedService?: string | null;
    topDemandSuburb?: string | null;
    highestValueOwner?: UserInsight | null;
    topSupplier?: UserInsight | null;
  };
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA");
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function getUserName(user?: UserInsight | null) {
  if (!user) return "—";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function getActivityBadgeClass(status: string) {
  switch (status) {
    case "HOT":
      return "bg-red-100 text-red-700";
    case "VERY_ACTIVE":
      return "bg-green-100 text-green-700";
    case "ACTIVE":
      return "bg-blue-100 text-blue-700";
    case "WARM":
      return "bg-amber-100 text-amber-700";
    case "COLD":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminUsersPage() {
  const { data, isLoading, error } = useQuery<UsersInsightsResponse>({
    queryKey: ["adminUserInsights"],
    queryFn: async () => {
      const res = await api.get("/api/admin/users/insights");
      return res.data;
    },
  });

  const users = data?.users ?? [];
  const marketplace = data?.marketplace;

  const metrics = useMemo(() => {
    return {
      total: users.length,
      owners: users.filter((user) => user.role === "OWNER").length,
      suppliers: users.filter((user) => user.role === "SUPPLIER").length,
      active: users.filter((user) =>
        ["HOT", "VERY_ACTIVE", "ACTIVE"].includes(user.activityStatus)
      ).length,
    };
  }, [users]);

  if (isLoading) return <div className="p-6">Loading users...</div>;

  if (error || !data?.ok) {
    return <div className="p-6 text-red-600">Unable to load users.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-6 pt-10 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          User Operations
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Users</h1>
        <p className="mt-2 text-gray-500">
          View user activity, bookings, spend, supplier services and marketplace
          health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Users
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{metrics.total}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Owners
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{metrics.owners}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Suppliers
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">
            {metrics.suppliers}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Active Users
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600">
            {metrics.active}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-gray-900">Marketplace Insights</h2>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Most booked service</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatLabel(marketplace?.mostBookedService)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Top demand suburb</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatLabel(marketplace?.topDemandSuburb)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Highest value owner</p>
            <p className="mt-1 font-semibold text-gray-900">
              {getUserName(marketplace?.highestValueOwner)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Top supplier</p>
            <p className="mt-1 font-semibold text-gray-900">
              {getUserName(marketplace?.topSupplier)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">User Insights</h2>
          <p className="mt-1 text-sm text-gray-500">
            Activity is calculated from booking behaviour and recent usage.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Activity</th>
                <th className="px-5 py-4 font-semibold">Bookings</th>
                <th className="px-5 py-4 font-semibold">Top Service</th>
                <th className="px-5 py-4 font-semibold">Top Suburb</th>
                <th className="px-5 py-4 font-semibold">Spend / Revenue</th>
                <th className="px-5 py-4 font-semibold">Supplier</th>
                <th className="px-5 py-4 font-semibold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-gray-500" colSpan={9}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {getUserName(user)}
                      </p>
                      <p className="mt-1 text-gray-500">{user.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getActivityBadgeClass(
                          user.activityStatus
                        )}`}
                      >
                        {formatLabel(user.activityStatus)}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        Last booking: {formatDate(user.lastBookingAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {user.totalBookingCount}
                      </p>
                      <p className="text-xs text-gray-500">
                        Owner {user.ownerBookingCount} / Supplier{" "}
                        {user.supplierBookingCount}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatLabel(user.topService)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatLabel(user.topSuburb)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {formatMoney(user.ownerSpendCents)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Revenue: {formatMoney(user.supplierRevenueCents)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {user.supplierProfile ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.supplierProfile.businessName || "Supplier profile"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatLabel(user.supplierProfile.approvalStatus)}
                            {user.supplierProfile.isPublicVisible
                              ? " · Public"
                              : " · Hidden"}
                          </p>
                          {user.supplierProfile.services?.length ? (
                            <p className="mt-1 text-xs text-gray-500">
                              {user.supplierProfile.services
                                .map(formatLabel)
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}