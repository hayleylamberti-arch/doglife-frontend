import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminDashboard() {

  const { data, isLoading } = useQuery({
    queryKey: ["waitlistSummary"],
    queryFn: async () => {
      const res = await api.get("/api/admin/waitlist-summary");
      return res.data;
    }
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No data</div>;

  const { suburbSummary, serviceSummary } = data;

  const totalDemand = suburbSummary.reduce(
    (sum: number, s: any) => sum + s._count.id,
    0
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">

      <h1 className="text-3xl font-bold">DogLife Demand Dashboard</h1>

      {/* TOTAL */}
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-gray-500">Total Waitlist</p>
        <p className="text-2xl font-bold">{totalDemand}</p>
      </div>

      {/* SUBURBS */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Top Suburbs</h2>

        {suburbSummary
          .sort((a: any, b: any) => b._count.id - a._count.id)
          .map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>
                {item.suburb} ({item.province})
              </span>
              <span>{item._count.id}</span>
            </div>
          ))}
      </div>

      {/* SERVICES */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Top Services</h2>

        {Object.entries(serviceSummary)
          .sort((a: any, b: any) => b[1] - a[1])
          .map(([service, count]) => (
            <div key={service} className="flex justify-between">
              <span>{service}</span>
              <span>{count as number}</span>
            </div>
          ))}
      </div>

    </div>
  );
}