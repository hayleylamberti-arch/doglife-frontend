import { useMemo, useState } from "react";
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
    businessName: string | null;
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
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA");
}

function formatMoney(cents?: number | null) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUserName(user: UserInsight) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

function getActivityBadgeClass(status: string) {
  switch (status) {
    case "HOT":
      return "border-red-200 bg-red-50 text-red-700";
    case "VERY_ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ACTIVE":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "WARM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COLD":
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");

  const { data, isLoading, error } = useQuery<UsersInsightsResponse>({
    queryKey: ["adminUsersInsights"],
    queryFn: async () => {
      const res = await api.get("/api/admin/users/insights");
      return res.data;
    },
  });

  const users = data?.users ?? [];

  const metrics = useMemo(
    () => ({
      total: users.length,
      owners: users.filter((user) => user.role === "OWNER").length,
      suppliers: users.filter((user) => user.role === "SUPPLIER").length,
      active: users.filter((user) =>
        ["HOT", "VERY_ACTIVE", "ACTIVE"].includes(user.activityStatus)
      ).length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (
        activityFilter !== "ALL" &&
        user.activityStatus !== activityFilter
      ) {
        return false;
      }

      if (!search) return true;

      const searchable = [
        getUserName(user),
        user.email,
        user.role,
        user.supplierProfile?.businessName,
        user.topService,
        user.topSuburb,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [users, roleFilter, activityFilter, searchTerm]);

  if (isLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  if (error || !data?.ok) {
    return <div className="p-6 text-red-600">Unable to load users.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 pb-10 pt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            User Operations
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Review owner and supplier activity, booking behaviour and account
            value.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[560px]">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search users..."
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="ALL">All roles</option>
            <option value="OWNER">Owners</option>
            <option value="SUPPLIER">Suppliers</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={activityFilter}
            onChange={(event) => setActivityFilter(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="ALL">All activity</option>
            <option value="HOT">Hot</option>
            <option value="VERY_ACTIVE">Very active</option>
            <option value="ACTIVE">Active</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Users", metrics.total, "text-gray-900"],
          ["Owners", metrics.owners, "text-blue-600"],
          ["Suppliers", metrics.suppliers, "text-emerald-600"],
          ["Active Users", metrics.active, "text-amber-600"],
        ].map(([label, value, colour]) => (
          <div key={String(label)} className="rounded-xl bg-white p-5 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </p>
            <p className={`mt-2 text-4xl font-bold ${colour}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white shadow">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">User Activity</h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users.
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-6 text-gray-500">No users found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const isSupplier = user.role === "SUPPLIER";
              const bookingCount = isSupplier
                ? user.supplierBookingCount
                : user.ownerBookingCount;
              const value = isSupplier
                ? user.supplierRevenueCents
                : user.ownerSpendCents;

              return (
                <div key={user.id} className="p-5">
                  <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {getUserName(user)}
                        </h3>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {formatLabel(user.role)}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getActivityBadgeClass(
                            user.activityStatus
                          )}`}
                        >
                          {formatLabel(user.activityStatus)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">{user.email}</p>

                      {user.supplierProfile?.businessName && (
                        <p className="mt-2 font-medium text-gray-800">
                          {user.supplierProfile.businessName}
                        </p>
                      )}

                      {isSupplier && user.supplierProfile && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>
                            {formatLabel(
                              user.supplierProfile.approvalStatus ?? null
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {user.supplierProfile.isPublicVisible
                              ? "Public"
                              : "Hidden"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Activity
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        {bookingCount} bookings
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Last booking: {formatDate(user.lastBookingAt)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Last login: {formatDate(user.lastLoginAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Marketplace
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        {formatMoney(value)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {isSupplier ? "Booking value" : "Owner spend"}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Top service: {formatLabel(user.topService)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Top suburb: {formatLabel(user.topSuburb)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Account
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Joined: {formatDate(user.createdAt)}
                      </p>

                      {isSupplier &&
                        user.supplierProfile?.services &&
                        user.supplierProfile.services.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {user.supplierProfile.services
                              .slice(0, 4)
                              .map((service) => (
                                <span
                                  key={service}
                                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                >
                                  {formatLabel(service)}
                                </span>
                              ))}

                            {user.supplierProfile.services.length > 4 && (
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                +{user.supplierProfile.services.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
