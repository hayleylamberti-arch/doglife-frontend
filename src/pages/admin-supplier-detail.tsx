import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";

type AdminSupplierDetail = {
  id: string;
  businessName?: string | null;
  email?: string | null;
  phone?: string | null;
  suburb?: string | null;
  about?: string | null;
  website?: string | null;
  approvalStatus?: string | null;
  isPublicVisible?: boolean;
  submittedAt?: string | null;
  approvedAt?: string | null;
  serviceSuburbs?: string[];
  services?: Array<{
    id: string;
    serviceType: string;
    price?: number | null;
    active?: boolean;
  }>;
  verificationDocuments?: Array<{
    id: string;
    type: string;
    status: string;
    fileUrl?: string | null;
  }>;
};

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

  const supplier: AdminSupplierDetail = data.supplier;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <Link className="text-sm text-blue-600" to="/admin/suppliers">
          ← Back to suppliers
        </Link>

        <h1 className="mt-3 text-3xl font-bold">
          {supplier.businessName || "Supplier detail"}
        </h1>

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

        <p>
          <strong>Email:</strong> {supplier.email || "—"}
        </p>
        <p>
          <strong>Phone:</strong> {supplier.phone || "—"}
        </p>
        <p>
          <strong>Base suburb:</strong> {supplier.suburb || "—"}
        </p>
        <p>
          <strong>Website:</strong>{" "}
          {supplier.website ? (
            <a className="text-blue-600" href={supplier.website} target="_blank">
              {supplier.website}
            </a>
          ) : (
            "—"
          )}
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Profile summary</h2>
        <p className="text-gray-700">{supplier.about || "No profile summary yet."}</p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Service suburbs</h2>

        {supplier.serviceSuburbs?.length ? (
          <div className="flex flex-wrap gap-2">
            {supplier.serviceSuburbs.map((suburb) => (
              <span key={suburb} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {suburb}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No service suburbs listed.</p>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Services</h2>

        {supplier.services?.length ? (
          <div className="space-y-2">
            {supplier.services.map((service) => (
              <div key={service.id} className="flex justify-between border-b py-2 last:border-b-0">
                <span>{service.serviceType}</span>
                <span className="text-gray-500">
                  {service.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No services listed.</p>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-semibold">Verification documents</h2>

        {supplier.verificationDocuments?.length ? (
          <div className="space-y-2">
            {supplier.verificationDocuments.map((doc) => (
              <div key={doc.id} className="flex justify-between border-b py-2 last:border-b-0">
                <span>{doc.type}</span>
                <span>{doc.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No verification documents uploaded.</p>
        )}
      </section>
    </div>
  );
}