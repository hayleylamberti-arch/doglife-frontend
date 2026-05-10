import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function AdminSupplierDetailPage() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminSupplierDetail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get(`/api/admin/suppliers/${id}`);
      return res.data;
    },
  });

  if (isLoading) return <div className="p-6">Loading supplier...</div>;

  if (error || !data?.ok) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-red-600">Unable to load supplier details.</p>
        <Link className="mt-4 inline-block text-blue-600" to="/admin/suppliers">
          Back to suppliers
        </Link>
      </div>
    );
  }

  const supplier = data.supplier;
  const serviceSuburbs =
    supplier.operatingAreas
      ?.map((area: any) => area?.suburb?.suburbName)
      .filter(Boolean) || [];

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <Link className="text-blue-600" to="/admin/suppliers">
        ← Back to suppliers
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{supplier.businessName || "Supplier detail"}</h1>
        <p className="text-gray-500">
          Review profile, services, coverage and verification information.
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
            {supplier.approvalStatus || "UNKNOWN"}
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
            {supplier.isPublicVisible ? "Publicly visible" : "Not public"}
          </span>
        </div>

        <p><strong>Email:</strong> {supplier.user?.email || "—"}</p>
        <p><strong>Phone:</strong> {supplier.businessPhone || "—"}</p>
        <p><strong>Base suburb:</strong> {supplier.suburb || "—"}</p>
        <p>
          <strong>Website:</strong>{" "}
          {supplier.websiteUrl ? (
            <a className="text-blue-600" href={supplier.websiteUrl} target="_blank" rel="noreferrer">
              {supplier.websiteUrl}
            </a>
          ) : "—"}
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Profile summary</h2>
        <p>{supplier.aboutServices || "No profile summary yet."}</p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Service suburbs</h2>
        {serviceSuburbs.length ? serviceSuburbs.join(", ") : "No service suburbs listed."}
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Services</h2>
        {supplier.services?.length ? (
          supplier.services.map((service: any) => (
            <div key={service.id} className="flex justify-between border-b py-2 last:border-b-0">
              <span>{service.serviceType || service.type || "Service"}</span>
              <span>{service.active ? "Active" : "Inactive"}</span>
            </div>
          ))
        ) : (
          <p>No services listed.</p>
        )}
      </section>
    </div>
  );
}