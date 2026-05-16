import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type SuburbSummaryItem = {
  suburb: string;
  province?: string;
  _count: {
    id: number;
  };
};

type WaitlistSummaryResponse = {
  suburbSummary: SuburbSummaryItem[];
  serviceSummary: Record<string, number>;
};

type SupplierItem = {
  id: string;
  approvalStatus: string;
  isPublicVisible?: boolean;
};

type SuppliersResponse = {
  ok: boolean;
  suppliers: SupplierItem[];
};

type UserInsight = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  activityStatus: string;
  ownerSpendCents: number;
  supplierBookingCount: number;
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

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function getUserName(user?: UserInsight | null) {
  if (!user) return "—";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

export default function AdminDashboard() {
  const waitlistQuery = useQuery<WaitlistSummaryResponse>({
    queryKey: ["waitlistSummary"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist-summary");
      return res.data;
    },
  });

  const suppliersQuery = useQuery<SuppliersResponse>({
    queryKey: ["admin-suppliers-dashboard"],
    queryFn: async () => {
      const res = await api.get("/api/admin/suppliers");
      return res.data;
    },
  });

  const usersQuery = useQuery<UsersInsightsResponse>({
    queryKey: ["adminUserInsights"],
    queryFn: async () => {
      const res = await api.get("/api/admin/users/insights");
      return res.data;
    },
  });

  const suburbSummary = waitlistQuery.data?.suburbSummary ?? [];
  const serviceSummary = waitlistQuery.data?.serviceSummary ?? {};
  const suppliers = suppliersQuery.data?.suppliers ?? [];
  const users = usersQuery.data?.users ?? [];
  const marketplace = usersQuery.data?.marketplace;

  const topSuburbs = useMemo(() => {
    return [...suburbSummary].sort((a, b) => b._count.id - a._count.id);
  }, [suburbSummary]);

  const topServices = useMemo(() => {
    return Object.entries(serviceSummary).sort(([, a], [, b]) => b - a);
  }, [serviceSummary]);

  const totalDemand = suburbSummary.reduce(
    (sum, suburb) => sum + suburb._count.id,
    0
  );

  const supplierMetrics = useMemo(() => {
    return {
      total: suppliers.length,
      needsReview: suppliers.filter((supplier) =>
        ["SUBMITTED", "UNDER_REVIEW", "REJECTED"].includes(
          supplier.approvalStatus
        )
      ).length,
      approved: suppliers.filter(
        (supplier) => supplier.approvalStatus === "APPROVED"
      ).length,
      visible: suppliers.filter((supplier) => supplier.isPublicVisible).length,
    };
  }, [suppliers]);

  const userMetrics = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) =>
        ["HOT", "VERY_ACTIVE", "ACTIVE"].includes(user.activityStatus)
      ).length,
    };
  }, [users]);

  const highestDemandSuburb = topSuburbs[0];
  const mostRequestedService = topServices[0];

  const isLoading =
    waitlistQuery.isLoading || suppliersQuery.isLoading || usersQuery.isLoading;

  const hasError =
    waitlistQuery.error || suppliersQuery.error || usersQuery.error;

  if (isLoading) return <div className="p-6">Loading dashboard...</div>;

  if (hasError) {
    return <div className="p-6 text-red-600">Unable to load dashboard.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-6 pt-10 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Admin Overview
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          DogLife Operations Dashboard
        </h1>
        <p className="mt-2 text-gray-500">
          Track demand, supplier coverage, user activity and marketplace health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Waitlist Demand
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{totalDemand}</p>
          <p className="mt-1 text-sm text-gray-500">Lead requests</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Suppliers
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">
            {supplierMetrics.approved}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {supplierMetrics.visible} publicly visible
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Needs Review
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600">
            {supplierMetrics.needsReview}
          </p>
          <p className="mt-1 text-sm text-gray-500">Supplier follow-ups</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Active Users
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900">
            {userMetrics.active}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Of {userMetrics.total} users
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Action Required</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use this dashboard to prioritise supplier review, suburb coverage and
          demand conversion.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Highest-demand suburb</p>
            <p className="mt-1 font-semibold text-gray-900">
              {highestDemandSuburb
                ? `${highestDemandSuburb.suburb}${
                    highestDemandSuburb.province
                      ? ` (${highestDemandSuburb.province})`
                      : ""
                  }`
                : "No suburb demand yet"}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Most booked service</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatLabel(marketplace?.mostBookedService)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Top supplier</p>
            <p className="mt-1 font-semibold text-gray-900">
              {getUserName(marketplace?.topSupplier)}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Recommended next action</p>
            <p className="mt-1 font-semibold text-gray-900">
              {supplierMetrics.needsReview > 0
                ? "Review supplier applications"
                : highestDemandSuburb
                  ? `Review coverage in ${highestDemandSuburb.suburb}`
                  : "Monitor new demand"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href="/admin-suppliers"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          Review Suppliers
          <p className="mt-1 text-sm font-normal text-gray-500">
            {supplierMetrics.needsReview} need follow-up
          </p>
        </a>

        <a
          href="/admin-waitlist"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          View Waitlist
          <p className="mt-1 text-sm font-normal text-gray-500">
            {totalDemand} lead requests
          </p>
        </a>

        <a
          href="/admin-users"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          Manage Users
          <p className="mt-1 text-sm font-normal text-gray-500">
            {userMetrics.active} active users
          </p>
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Top Demand Suburbs</h2>

          <div className="mt-4 space-y-3">
            {topSuburbs.length === 0 ? (
              <p className="text-gray-500">No suburb demand yet.</p>
            ) : (
              topSuburbs.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.suburb}-${item.province ?? "unknown"}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      #{index + 1}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {item.suburb}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.province ?? "Province not captured"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {item._count.id}
                    </p>
                    <p className="text-xs text-gray-500">lead request</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Top Requested Services</h2>

          <div className="mt-4 space-y-3">
            {topServices.length === 0 ? (
              <p className="text-gray-500">No service demand yet.</p>
            ) : (
              topServices.slice(0, 5).map(([service, count], index) => (
                <div
                  key={service}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      #{index + 1}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatLabel(service)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">requests</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Marketplace Highlights</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Top demand suburb</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatLabel(marketplace?.topDemandSuburb)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Highest value owner</p>
              <p className="mt-1 font-semibold text-gray-900">
                {getUserName(marketplace?.highestValueOwner)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Most booked service</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatLabel(marketplace?.mostBookedService)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 