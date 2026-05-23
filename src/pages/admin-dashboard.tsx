import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type SuburbSummaryItem = {
  suburb: string;
  province?: string;
  _count: { id: number };
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

function getUrgencyClass(count: number) {
  if (count >= 5) return "border-red-300 bg-red-50";
  if (count > 0) return "border-amber-300 bg-amber-50";
  return "border-gray-200 bg-white";
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

  const topWaitlistSuburbs = useMemo(
    () => [...suburbSummary].sort((a, b) => b._count.id - a._count.id),
    [suburbSummary]
  );

  const topWaitlistServices = useMemo(
    () => Object.entries(serviceSummary).sort(([, a], [, b]) => b - a),
    [serviceSummary]
  );

  const totalWaitlistDemand = suburbSummary.reduce(
    (sum, suburb) => sum + suburb._count.id,
    0
  );

  const supplierMetrics = useMemo(() => {
    const approved = suppliers.filter(
      (supplier) => supplier.approvalStatus === "APPROVED"
    );

    return {
      total: suppliers.length,
      supplierQueue: suppliers.filter((supplier) =>
        ["SUBMITTED", "UNDER_REVIEW", "REJECTED"].includes(
          supplier.approvalStatus
        )
      ).length,
      approved: approved.length,
      visible: suppliers.filter((supplier) => supplier.isPublicVisible).length,
      hiddenApproved: approved.filter((supplier) => !supplier.isPublicVisible)
        .length,
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

  const highestWaitlistDemand = topWaitlistSuburbs[0];
  const topWaitlistService = topWaitlistServices[0];

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/admin/waitlist" className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Waitlist Demand
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">
            {totalWaitlistDemand}
          </p>
          <p className="mt-1 text-sm text-gray-500">Lead requests</p>
        </Link>

        <Link to="/admin/suppliers" className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Visible Suppliers
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">
            {supplierMetrics.visible}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {supplierMetrics.approved} approved
          </p>
        </Link>

        <Link
          to="/admin/suppliers"
          className={`rounded-xl border p-5 shadow ${getUrgencyClass(
            supplierMetrics.supplierQueue
          )}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Supplier Queue
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600">
            {supplierMetrics.supplierQueue}
          </p>
          <p className="mt-1 text-sm text-gray-500">Need follow-up</p>
        </Link>

        <Link to="/admin/users" className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Active Users
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900">
            {userMetrics.active}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Of {userMetrics.total} users
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Action Required</h2>
        <p className="mt-1 text-sm text-gray-600">
          Prioritise supplier review, suburb coverage and demand conversion.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Highest waitlist demand</p>
            <p className="mt-1 font-semibold text-gray-900">
              {highestWaitlistDemand
                ? `${highestWaitlistDemand.suburb}${
                    highestWaitlistDemand.province
                      ? ` (${highestWaitlistDemand.province})`
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
              {supplierMetrics.supplierQueue > 0
                ? "Review supplier queue"
                : highestWaitlistDemand
                  ? `Review coverage in ${highestWaitlistDemand.suburb}`
                  : "Monitor new demand"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/admin/suppliers"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          Review Suppliers
          <p className="mt-1 text-sm font-normal text-gray-500">
            {supplierMetrics.supplierQueue} need follow-up
          </p>
        </Link>

        <Link
          to="/admin/waitlist"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          View Waitlist
          <p className="mt-1 text-sm font-normal text-gray-500">
            {totalWaitlistDemand} lead requests
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          Manage Users
          <p className="mt-1 text-sm font-normal text-gray-500">
            {userMetrics.active} active users
          </p>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Marketplace Health</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Supplier visibility</p>
            <p className="mt-1 font-semibold text-gray-900">
              {supplierMetrics.visible} / {supplierMetrics.approved} approved
            </p>
          </div>

          <div
            className={`rounded-lg border p-4 ${getUrgencyClass(
              supplierMetrics.hiddenApproved
            )}`}
          >
            <p className="text-sm text-gray-500">Hidden approved suppliers</p>
            <p className="mt-1 font-semibold text-gray-900">
              {supplierMetrics.hiddenApproved}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Most booked suburb</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatLabel(marketplace?.topDemandSuburb)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Active user ratio</p>
            <p className="mt-1 font-semibold text-gray-900">
              {userMetrics.active} / {userMetrics.total}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Waitlist Demand Suburbs</h2>

          <div className="mt-4 space-y-3">
            {topWaitlistSuburbs.length === 0 ? (
              <p className="text-gray-500">No suburb demand yet.</p>
            ) : (
              topWaitlistSuburbs.slice(0, 5).map((item, index) => (
                <Link
                  to="/admin/waitlist"
                  key={`${item.suburb}-${item.province ?? "unknown"}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:bg-gray-50"
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
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Waitlist Service Demand</h2>

          <div className="mt-4 space-y-3">
            {topWaitlistServices.length === 0 ? (
              <p className="text-gray-500">No waitlist service demand yet.</p>
            ) : (
              topWaitlistServices.slice(0, 5).map(([service, count], index) => (
                <Link
                  to="/admin/waitlist"
                  key={service}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:bg-gray-50"
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
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Growth Opportunities</h2>

          <div className="mt-4 space-y-3">
            <Link
              to="/admin/waitlist"
              className={`block rounded-lg border p-4 hover:border-blue-200 hover:bg-gray-50 ${getUrgencyClass(
                highestWaitlistDemand?._count.id ?? 0
              )}`}
            >
              <p className="text-sm text-gray-500">Hot area to review</p>
              <p className="mt-1 font-semibold text-gray-900">
                {highestWaitlistDemand
                  ? highestWaitlistDemand.suburb
                  : "No waitlist suburb yet"}
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="block rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:bg-gray-50"
            >
              <p className="text-sm text-gray-500">Booked service strength</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatLabel(marketplace?.mostBookedService)}
              </p>
            </Link>

            <Link
              to="/admin/waitlist"
              className="block rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:bg-gray-50"
            >
              <p className="text-sm text-gray-500">Waitlist service signal</p>
              <p className="mt-1 font-semibold text-gray-900">
                {topWaitlistService
                  ? formatLabel(topWaitlistService[0])
                  : "No service captured yet"}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}