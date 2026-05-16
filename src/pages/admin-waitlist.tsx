import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type SuburbSummaryItem = {
  suburb: string;
  province?: string;
  _count: {
    id: number;
  };
};

type WaitlistEntry = {
  id: string;
  email: string;
  suburb?: string | null;
  province?: string | null;
  postcode?: string | null;
  userType?: string | null;
  serviceTypes?: string[];
  businessStatus?: string | null;
  createdAt: string;
};

type WaitlistSummaryResponse = {
  suburbSummary: SuburbSummaryItem[];
  serviceSummary: Record<string, number>;
};

type WaitlistEntriesResponse = {
  waitlist: WaitlistEntry[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

export default function AdminWaitlistPage() {
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);

  const summaryQuery = useQuery<WaitlistSummaryResponse>({
    queryKey: ["waitlistSummary"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist-summary");
      return res.data;
    },
  });

  const entriesQuery = useQuery<WaitlistEntriesResponse>({
    queryKey: ["adminWaitlistEntries"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist");
      return res.data;
    },
  });

  const suburbSummary = summaryQuery.data?.suburbSummary ?? [];
  const serviceSummary = summaryQuery.data?.serviceSummary ?? {};
  const waitlistEntries = entriesQuery.data?.waitlist ?? [];

  const topSuburbs = useMemo(() => {
    return [...suburbSummary].sort((a, b) => b._count.id - a._count.id);
  }, [suburbSummary]);

  const topServices = useMemo(() => {
    return Object.entries(serviceSummary).sort(([, a], [, b]) => b - a);
  }, [serviceSummary]);

  const filteredEntries = useMemo(() => {
    if (!selectedSuburb) return waitlistEntries;

    return waitlistEntries.filter(
      (entry) => entry.suburb?.toLowerCase() === selectedSuburb.toLowerCase()
    );
  }, [waitlistEntries, selectedSuburb]);

  const totalDemand = suburbSummary.reduce(
    (sum, item) => sum + item._count.id,
    0
  );

  const highestDemandSuburb = topSuburbs[0];
  const mostRequestedService = topServices[0];

  if (summaryQuery.isLoading || entriesQuery.isLoading) {
    return <div className="p-6">Loading waitlist...</div>;
  }

  if (summaryQuery.error || entriesQuery.error || !summaryQuery.data) {
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
          <p className="mt-1 text-sm text-gray-500">Lead requests</p>
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
              {mostRequestedService
                ? mostRequestedService[0]
                : "No service demand yet"}
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
                <button
                  key={`${item.suburb}-${item.province ?? "unknown"}-${index}`}
                  onClick={() =>
                    setSelectedSuburb(
                      selectedSuburb === item.suburb ? null : item.suburb
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                    selectedSuburb === item.suburb
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                  }`}
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
                </button>
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
                  As leads join the waitlist, service trends will appear here.
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
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Waitlist Requests</h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedSuburb
                ? `Showing requests for ${selectedSuburb}.`
                : "Showing all waitlist requests."}
            </p>
          </div>

          {selectedSuburb ? (
            <button
              onClick={() => setSelectedSuburb(null)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Clear filter
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Email / Lead</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Services Needed</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-gray-500">
                    No waitlist requests found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {entry.email}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Waitlist lead, not necessarily a registered user
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {entry.suburb || "No suburb"}
                      </p>
                      <p className="text-gray-500">
                        {entry.province || "No province"}
                        {entry.postcode ? `, ${entry.postcode}` : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {entry.serviceTypes?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.serviceTypes.map((service) => (
                            <span
                              key={`${entry.id}-${service}`}
                              className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                            >
                              {formatLabel(service)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No service captured</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {formatLabel(entry.userType)}
                      </p>
                      {entry.businessStatus ? (
                        <p className="text-gray-500">
                          {formatLabel(entry.businessStatus)}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(entry.createdAt)}
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