import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminWaitlistPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["waitlistSummary"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist-summary");
      return res.data;
    },
  });

  if (isLoading) return <div className="p-6">Loading waitlist...</div>;

  if (error || !data) {
    return <div className="p-6 text-red-600">Unable to load waitlist data.</div>;
  }

  const { suburbSummary = [], serviceSummary = {} } = data;

  const totalDemand = suburbSummary.reduce(
    (sum: number, item: any) => sum + item._count.id,
    0
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Waitlist Demand</h1>
        <p className="text-gray-500">
          View owner demand by suburb and requested service.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-gray-500">Total Waitlist</p>
        <p className="text-3xl font-bold">{totalDemand}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Demand by Suburb</h2>

        {suburbSummary.length === 0 ? (
          <p className="text-gray-500">No suburb demand yet.</p>
        ) : (
          suburbSummary
            .sort((a: any, b: any) => b._count.id - a._count.id)
            .map((item: any, index: number) => (
              <div
                key={`${item.suburb}-${index}`}
                className="flex justify-between border-b py-2 last:border-b-0"
              >
                <span>
                  {item.suburb} ({item.province})
                </span>
                <span className="font-semibold">{item._count.id}</span>
              </div>
            ))
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Demand by Service</h2>

        {Object.keys(serviceSummary).length === 0 ? (
          <p className="text-gray-500">No service demand yet.</p>
        ) : (
          Object.entries(serviceSummary)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([service, count]) => (
              <div
                key={service}
                className="flex justify-between border-b py-2 last:border-b-0"
              >
                <span>{service}</span>
                <span className="font-semibold">{count as number}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}