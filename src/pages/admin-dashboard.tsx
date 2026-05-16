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

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">Admin Overview</p>
        <h1 className="text-3xl font-bold text-gray-900">
          DogLife Operations Dashboard
        </h1>
        <p className="mt-2 text-gray-500">
          Track demand, identify supply gaps, and prioritise admin actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Waitlist Demand</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalDemand}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Demand Suburbs</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {suburbSummary.length}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Requested Services</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {topServices.length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Action Required</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use this page to decide where DogLife needs supplier coverage next.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Highest-demand suburb</p>
            <p className="mt-1 font-semibold text-gray-900">
              {topSuburbs[0]
                ? `${topSuburbs[0].suburb}${
                    topSuburbs[0].province ? ` (${topSuburbs[0].province})` : ""
                  }`
                : "No suburb demand yet"}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">Most requested service</p>
            <p className="mt-1 font-semibold text-gray-900">
              {topServices[0] ? topServices[0][0] : "No service demand yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="font-semibold text-gray-900">Top Demand Suburbs</h2>

          <div className="mt-4 space-y-3">
            {topSuburbs.length === 0 ? (
              <p className="text-gray-500">No suburb demand yet.</p>
            ) : (
              topSuburbs.map((item, index) => (
                <div
                  key={`${item.suburb}-${item.province ?? "unknown"}-${index}`}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.suburb}</p>
                    <p className="text-sm text-gray-500">
                      {item.province ?? "Province not captured"}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    {item._count.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="font-semibold text-gray-900">Top Requested Services</h2>

          <div className="mt-4 space-y-3">
            {topServices.length === 0 ? (
              <p className="text-gray-500">No service demand yet.</p>
            ) : (
              topServices.map(([service, count]) => (
                <div
                  key={service}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-gray-900">{service}</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}