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

export default function AdminWaitlistPage() {
  const { data, isLoading, error } = useQuery<WaitlistSummaryResponse>({
    queryKey: ["waitlistSummary"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist-summary");
      return res.data;
    },
  });

  const suburbSummary = data?.suburbSummary ?? [];
  const serviceSummary = data?.serviceSummary ?? {};

  const topSuburbs = useMemo(() => {
    return [...suburbSummary].sort((a, b) => b._count.id - a._count.id);
  }, [suburbSummary]);

  const topServices = useMemo(() => {
    return Object.entries(serviceSummary).sort(([, a], [, b]) => b - a);
  }, [serviceSummary]);

  const totalDemand = suburbSummary.reduce(
    (sum, item) => sum + item._count.id,
    0
  );

  const highestDemandSuburb = topSuburbs[0];
  const mostRequestedService = topServices[0];

  if (isLoading) return <div className="p-6">Loading waitlist...</div>;

  if (error || !data) {
    return <div className="p-6 text-red-600">Unable to load waitlist data.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-6 pt-10 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Demand Operations
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Waitlist Demand
        </h1>
        <p className="mt-2 text-gray-500">
          Track owner demand by suburb and requested service to guide supplier
          growth.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Waitlist
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{totalDemand}</p>
          <p className="mt-1 text-sm text-gray-500">Owner requests</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Demand Suburbs
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">
            {topSuburbs.length}
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
          <p className="mt-1 text-sm text-gray-500">Service categories</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-gray-900">Growth Signal</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use this page to decide which suburbs need supplier acquisition next.
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
              {mostRequestedService ? mostRequestedService[0] : "No service demand yet"}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Recommended action</p>
            <p className="mt-1 font-semibold text-gray-900">
              {highestDemandSuburb
                ? `Recruit suppliers in ${highestDemandSuburb.suburb}`
                : "Monitor new waitlist entries"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Demand by Suburb</h2>

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
          <h2 className="font-semibold text-gray-900">Demand by Service</h2>

          <div className="mt-4 space-y-3">
            {topServices.length === 0 ? (
              <div>
                <p className="text-gray-500">No service demand captured yet.</p>
                <p className="mt-1 text-sm text-gray-400">
                  As owners join the waitlist, service trends will appear here.
                </p>
              </div>
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