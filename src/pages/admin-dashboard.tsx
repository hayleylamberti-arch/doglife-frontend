import { useMemo, useState } from "react";
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

type BookingSummaryResponse = {
  ok: boolean;
  liveOperations: {
    timezone: string;
    inProgress: number;
    startingToday: number;
    endingToday: number;
    startingNext7Days: number;
    inProgressBookings: Array<{
      id: string;
      status: string;
      serviceType: string;
      startAt: string;
      endAt: string;
      supplier: {
        id: string;
        businessName: string | null;
      };
    }>;
  };
  period: {
    key: string;
    currentStart: string | null;
    currentEnd: string;
    previousStart: string | null;
    previousEnd: string | null;
    timezone: string;
  };
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completedUnbilled: number;
    completed: number;
    cancelled: number;
    bookingValueCents: number;
    completedBookingValueCents: number;
  };
  previousSummary: {
    total: number;
    bookingValueCents: number;
    completedBookingValueCents: number;
  } | null;
  growth: {
    bookingsPercent: number | null;
    bookingValuePercent: number | null;
    completedBookingValuePercent: number | null;
  } | null;
  byService: Array<{
    service: string;
    bookingCount: number;
  }>;
  bySupplier: Array<{
    supplierId: string;
    businessName: string;
    bookingCount: number;
    bookingValueCents: number;
  }>;
};

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function formatCurrency(cents?: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

function formatGrowth(
  value: number | null | undefined,
  currentValue: number,
  previousValue: number
) {
  if (value === null || value === undefined) {
    if (currentValue > 0 && previousValue === 0) {
      return {
        label: "New vs previous period",
        className: "text-emerald-600",
      };
    }

    return null;
  }

  if (value > 0) {
    return {
      label: `↑ ${value}% vs previous period`,
      className: "text-emerald-600",
    };
  }

  if (value < 0) {
    return {
      label: `↓ ${Math.abs(value)}% vs previous period`,
      className: "text-red-600",
    };
  }

  return {
    label: "No change vs previous period",
    className: "text-gray-500",
  };
}

function formatOperationalDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
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
  const [bookingPeriod, setBookingPeriod] = useState<
    "today" | "7d" | "30d" | "all"
  >("30d");
  const [showInProgressBookings, setShowInProgressBookings] = useState(false);
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

  const bookingsQuery = useQuery<BookingSummaryResponse>({
    queryKey: ["admin-bookings-summary", bookingPeriod],
    queryFn: async () => {
      const res = await api.get(
        `/api/admin/bookings/summary?period=${bookingPeriod}`
      );
      return res.data;
    },
  });

  const suburbSummary = waitlistQuery.data?.suburbSummary ?? [];
  const serviceSummary = waitlistQuery.data?.serviceSummary ?? {};
  const suppliers = suppliersQuery.data?.suppliers ?? [];
  const users = usersQuery.data?.users ?? [];
  const marketplace = usersQuery.data?.marketplace;
  const liveOperations = bookingsQuery.data?.liveOperations;
  const bookingSummary = bookingsQuery.data?.summary;
  const bookingPrevious = bookingsQuery.data?.previousSummary;
  const bookingGrowth = bookingsQuery.data?.growth;
  const bookingServices = bookingsQuery.data?.byService ?? [];
  const bookingSuppliers = bookingsQuery.data?.bySupplier ?? [];

  const bookingsGrowthDisplay =
    bookingSummary && bookingPrevious && bookingGrowth
      ? formatGrowth(
          bookingGrowth.bookingsPercent,
          bookingSummary.total,
          bookingPrevious.total
        )
      : null;

  const bookingValueGrowthDisplay =
    bookingSummary && bookingPrevious && bookingGrowth
      ? formatGrowth(
          bookingGrowth.bookingValuePercent,
          bookingSummary.bookingValueCents,
          bookingPrevious.bookingValueCents
        )
      : null;

  const completedValueGrowthDisplay =
    bookingSummary && bookingPrevious && bookingGrowth
      ? formatGrowth(
          bookingGrowth.completedBookingValuePercent,
          bookingSummary.completedBookingValueCents,
          bookingPrevious.completedBookingValueCents
        )
      : null;

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

      <div className="rounded-xl bg-white p-5 shadow">
        <div>
          <h2 className="font-semibold text-gray-900">Live Operations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Services happening now and starting or ending soon.
          </p>
        </div>

        {bookingsQuery.isLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading live operations...</p>
        ) : bookingsQuery.error ? (
          <p className="mt-4 text-sm text-red-600">
            Live operations are unavailable.
          </p>
        ) : liveOperations ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                className={`rounded-lg border p-4 ${
                  liveOperations.inProgress > 0
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-100"
                }`}
              >
                <p className="text-sm text-gray-500">In progress</p>
                <p className="mt-1 text-3xl font-bold text-blue-700">
                  {liveOperations.inProgress}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Starting today</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {liveOperations.startingToday}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Ending today</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {liveOperations.endingToday}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Starting next 7 days</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {liveOperations.startingNext7Days}
                </p>
              </div>
            </div>

            {liveOperations.inProgressBookings.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-100 p-4">
              <button
                type="button"
                onClick={() =>
                  setShowInProgressBookings((current) => !current)
                }
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={showInProgressBookings}
              >
                <h3 className="font-semibold text-gray-900">
                  Currently in progress ({liveOperations.inProgressBookings.length})
                </h3>

                <span className="text-lg text-gray-500">
                  {showInProgressBookings ? "−" : "+"}
                </span>
              </button>

              {showInProgressBookings && (
                <div className="mt-3 space-y-3">
                  {liveOperations.inProgressBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.supplier.businessName || "Unnamed supplier"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatLabel(booking.serviceType)}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600">
                        {formatOperationalDate(booking.startAt)}
                        {" → "}
                        {formatOperationalDate(booking.endAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No live operational data yet.
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Booking Operations</h2>
            <p className="mt-1 text-sm text-gray-500">
              Booking activity by creation date, value and supplier.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["today", "Today"],
              ["7d", "Last 7 days"],
              ["30d", "Last 30 days"],
              ["all", "All time"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setBookingPeriod(
                    value as "today" | "7d" | "30d" | "all"
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  bookingPeriod === value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {bookingsQuery.isLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading booking data...</p>
        ) : bookingsQuery.error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">Booking data is unavailable.</p>
            <p className="mt-1 text-sm text-red-600">
              The rest of the admin dashboard is still available.
            </p>
          </div>
        ) : bookingSummary ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Total bookings</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {bookingSummary.total}
                </p>
                {bookingsGrowthDisplay && (
                  <p className={`mt-1 text-xs font-medium ${bookingsGrowthDisplay.className}`}>
                    {bookingsGrowthDisplay.label}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="mt-1 text-3xl font-bold text-amber-700">
                  {bookingSummary.pending}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-gray-500">In progress</p>
                <p className="mt-1 text-3xl font-bold text-blue-700">
                  {bookingSummary.inProgress}
                </p>
              </div>

              <div
                className={`rounded-lg border p-4 ${
                  bookingSummary.completedUnbilled > 0
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100"
                }`}
              >
                <p className="text-sm text-gray-500">Completed unbilled</p>
                <p
                  className={`mt-1 text-3xl font-bold ${
                    bookingSummary.completedUnbilled > 0
                      ? "text-red-700"
                      : "text-gray-900"
                  }`}
                >
                  {bookingSummary.completedUnbilled}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Total booking value</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(bookingSummary.bookingValueCents)}
                </p>
                {bookingValueGrowthDisplay && (
                  <p className={`mt-1 text-xs font-medium ${bookingValueGrowthDisplay.className}`}>
                    {bookingValueGrowthDisplay.label}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Completed booking value</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(bookingSummary.completedBookingValueCents)}
                </p>
                {completedValueGrowthDisplay && (
                  <p className={`mt-1 text-xs font-medium ${completedValueGrowthDisplay.className}`}>
                    {completedValueGrowthDisplay.label}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900">Booking status</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Pending</span><span className="font-semibold">{bookingSummary.pending}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Confirmed</span><span className="font-semibold">{bookingSummary.confirmed}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">In progress</span><span className="font-semibold">{bookingSummary.inProgress}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Completed unbilled</span><span className="font-semibold">{bookingSummary.completedUnbilled}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Completed</span><span className="font-semibold">{bookingSummary.completed}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cancelled</span><span className="font-semibold">{bookingSummary.cancelled}</span></div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900">Booked services</h3>
                <div className="mt-3 space-y-2">
                  {bookingServices.length === 0 ? (
                    <p className="text-sm text-gray-500">No bookings yet.</p>
                  ) : (
                    bookingServices.slice(0, 5).map((item) => (
                      <div key={item.service} className="flex justify-between text-sm">
                        <span className="text-gray-600">{formatLabel(item.service)}</span>
                        <span className="font-semibold">{item.bookingCount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900">Supplier booking activity</h3>
                <div className="mt-3 space-y-3">
                  {bookingSuppliers.length === 0 ? (
                    <p className="text-sm text-gray-500">No supplier bookings yet.</p>
                  ) : (
                    bookingSuppliers.slice(0, 5).map((item) => (
                      <div key={item.supplierId} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.businessName}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.bookingValueCents)}</p>
                        </div>
                        <span className="font-semibold">{item.bookingCount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No booking data yet.</p>
        )}
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