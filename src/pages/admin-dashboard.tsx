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

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<WaitlistSummaryResponse>({
    queryKey: ["waitlistSummary"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist-summary");
      return res.data;
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No data</div>;

  const suburbSummary = data.suburbSummary ?? [];
  const serviceSummary = data.serviceSummary ?? {};

  const totalDemand = suburbSummary.reduce(
    (sum, suburb) => sum + suburb._count.id,
    0
  );

  const topSuburbs = [...suburbSummary].sort(
    (a, b) => b._count.id - a._count.id
  );

  const topServices = Object.entries(serviceSummary).sort(
    ([, a], [, b]) => b - a
  );

  const highestDemandSuburb = topSuburbs[0];
  const mostRequestedService = topServices[0];

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
          Track demand, identify supply gaps, and prioritise admin actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Waitlist Demand
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{totalDemand}</p>
          <p className="mt-1 text-sm text-gray-500">Total owner requests</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Active Suburbs
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">
            {suburbSummary.length}
          </p>
          <p className="mt-1 text-sm text-gray-500">Suburbs with demand</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Services Requested
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600">
            {topServices.length}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Service demand captured
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Action Required</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use this page to decide where DogLife needs supplier coverage next.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
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
            <p className="text-sm text-gray-500">Most requested service</p>
            <p className="mt-1 font-semibold text-gray-900">
              {mostRequestedService
                ? mostRequestedService[0]
                : "No service demand yet"}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Recommended next action</p>
            <p className="mt-1 font-semibold text-gray-900">
              {highestDemandSuburb
                ? `Review supplier coverage in ${highestDemandSuburb.suburb}`
                : "Monitor new waitlist entries"}
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
        </a>

        <a
          href="/admin-waitlist"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          View Waitlist
        </a>

        <a
          href="/admin-users"
          className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 shadow transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:text-blue-600"
        >
          Manage Users
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Top Demand Suburbs</h2>

          <div className="mt-4 space-y-3">
            {topSuburbs.length === 0 ? (
              <p className="text-gray-500">No suburb demand yet.</p>
            ) : (
              topSuburbs.map((item, index) => (
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
                    <p className="text-xs text-gray-500">owner request</p>
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
              topServices.map(([service, count], index) => (
                <div
                  key={service}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      #{index + 1}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {service}
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
      </div>
    </div>
  );
}