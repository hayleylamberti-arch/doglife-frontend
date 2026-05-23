import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type SupplierStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

type SupplierItem = {
  id: string;
  businessName?: string | null;
  suburb?: string | null;
  businessPhone?: string | null;
  approvalStatus: SupplierStatus;
  isPublicVisible?: boolean;
  submittedAt?: string | null;
  rejectionReason?: string | null;
  identityVerified?: boolean;
  backgroundCheckVerified?: boolean;
  premisesVerified?: boolean;
  user?: {
    email?: string | null;
  } | null;
  services?: Array<{
    service: string;
    isActive?: boolean;
  }>;
  operatingAreas?: Array<{
    suburb?: {
      id: string;
      suburbName: string;
    } | null;
  }>;
};

const STATUS_OPTIONS: Array<{ value: "ALL" | SupplierStatus; label: string }> = [
  { value: "ALL", label: "All suppliers" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

function formatStatus(status: SupplierStatus) {
  return status.replace(/_/g, " ");
}

function formatServiceName(value: string) {
  return value.replace(/_/g, " ");
}

function getStatusBadgeClass(status: SupplierStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "UNDER_REVIEW":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-200";
    case "SUSPENDED":
      return "bg-gray-200 text-gray-800 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getServiceSuburbs(supplier: SupplierItem) {
  return (
    supplier.operatingAreas
      ?.map((area) => area?.suburb?.suburbName)
      .filter((value): value is string => Boolean(value)) || []
  );
}

function getActiveServices(supplier: SupplierItem) {
  return supplier.services?.filter((service) => service.isActive !== false) || [];
}

function getVerificationScore(supplier: SupplierItem) {
  return [
    supplier.identityVerified,
    supplier.backgroundCheckVerified,
    supplier.premisesVerified,
  ].filter(Boolean).length;
}

export default function AdminSuppliersPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | SupplierStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-suppliers", selectedStatus],
    queryFn: async () => {
      const res = await api.get("/api/admin/suppliers", {
        params: selectedStatus === "ALL" ? {} : { status: selectedStatus },
      });
      return res.data;
    },
  });

  const suppliers: SupplierItem[] = Array.isArray(data?.suppliers)
    ? data.suppliers
    : [];

  const filteredSuppliers = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return suppliers
      .filter((supplier) => {
        if (!normalisedSearch) return true;

        const searchableText = [
          supplier.businessName,
          supplier.user?.email,
          supplier.businessPhone,
          supplier.suburb,
          ...getServiceSuburbs(supplier),
          ...getActiveServices(supplier).map((service) => service.service),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalisedSearch);
      })
      .sort((a, b) => {
        const priority: Record<SupplierStatus, number> = {
          SUBMITTED: 1,
          UNDER_REVIEW: 2,
          REJECTED: 3,
          DRAFT: 4,
          APPROVED: 5,
          SUSPENDED: 6,
        };

        if (priority[a.approvalStatus] !== priority[b.approvalStatus]) {
          return priority[a.approvalStatus] - priority[b.approvalStatus];
        }

        const aSubmitted = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bSubmitted = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;

        return bSubmitted - aSubmitted;
      });
  }, [suppliers, searchTerm]);

  const metrics = useMemo(() => {
    return {
      total: suppliers.length,
      pending: suppliers.filter((supplier) =>
        ["SUBMITTED", "UNDER_REVIEW", "REJECTED"].includes(supplier.approvalStatus)
      ).length,
      approved: suppliers.filter((supplier) => supplier.approvalStatus === "APPROVED").length,
      visible: suppliers.filter((supplier) => supplier.isPublicVisible).length,
    };
  }, [suppliers]);

  const approveMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      await api.post(`/api/admin/suppliers/${supplierId}/approve`);
    },
    onMutate: (supplierId) => setActiveSupplierId(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    },
    onSettled: () => setActiveSupplierId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      supplierId,
      reason,
    }: {
      supplierId: string;
      reason?: string;
    }) => {
      await api.post(`/api/admin/suppliers/${supplierId}/reject`, { reason });
    },
    onMutate: ({ supplierId }) => setActiveSupplierId(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    },
    onError: (err: any) => {
      console.error("Reject supplier failed:", err?.response?.data || err);
      alert(err?.response?.data?.error || "Failed to reject supplier");
    },
    onSettled: () => setActiveSupplierId(null),
  });

  function handleReject(supplier: SupplierItem) {
    const reason = window.prompt(
      `Reject ${supplier.businessName || "this supplier"}.\nAdd a reason for the rejection:`,
      supplier.rejectionReason || ""
    );

    if (reason === null) return;

    rejectMutation.mutate({
      supplierId: supplier.id,
      reason: reason.trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-6 pt-10 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Supplier Operations
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Supplier Review</h1>
          <p className="mt-2 text-gray-500">
            Review suppliers, approve public listings, and manage marketplace visibility.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search suppliers..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as "ALL" | SupplierStatus)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total Suppliers
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{metrics.total}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Needs Review
          </p>
          <p className="mt-2 text-4xl font-bold text-amber-600">{metrics.pending}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Approved
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">{metrics.approved}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Publicly Visible
          </p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{metrics.visible}</p>
        </div>
      </div>

      {metrics.pending > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-gray-900">Action Required</h2>
          <p className="mt-1 text-sm text-gray-600">
            {metrics.pending} supplier{metrics.pending === 1 ? "" : "s"}{" "}
            {metrics.pending === 1 ? "needs" : "need"} admin review or follow-up.
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl bg-white p-6 shadow">Loading suppliers...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load suppliers.
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-gray-500 shadow">
          No suppliers found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Supplier Pipeline</h2>
            <p className="mt-1 text-sm text-gray-500">
              Prioritised by review status and most recent submission.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Supplier</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Visibility</th>
                  <th className="px-5 py-4 font-semibold">Verification</th>
                  <th className="px-5 py-4 font-semibold">Coverage</th>
                  <th className="px-5 py-4 font-semibold">Services</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((supplier) => {
                  const serviceSuburbs = getServiceSuburbs(supplier);
                  const activeServices = getActiveServices(supplier);
                  const verificationScore = getVerificationScore(supplier);
                  const isBusy = activeSupplierId === supplier.id;
                  const isApproved = supplier.approvalStatus === "APPROVED";

                  return (
                    <tr key={supplier.id} className="align-top hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/suppliers/${supplier.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {supplier.businessName || "Unnamed supplier"}
                        </Link>

                        <p className="mt-1 text-gray-500">
                          {supplier.user?.email || "No email captured"}
                        </p>

                        <p className="mt-1 text-gray-500">
                          {supplier.businessPhone || "No phone captured"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            to={`/admin/suppliers/${supplier.id}`}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                          >
                            View
                          </Link>

                          {!isApproved ? (
                            <Button
                              onClick={() => approveMutation.mutate(supplier.id)}
                              disabled={isBusy}
                            >
                              {isBusy ? "Working..." : "Approve"}
                            </Button>
                          ) : null}

                          <Button
                            variant="outline"
                            onClick={() => handleReject(supplier)}
                            disabled={isBusy}
                          >
                            {isBusy ? "Working..." : isApproved ? "Suspend" : "Reject"}
                          </Button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                            supplier.approvalStatus
                          )}`}
                        >
                          {formatStatus(supplier.approvalStatus)}
                        </span>

                        {supplier.rejectionReason ? (
                          <p
                            className="mt-1 max-w-[180px] truncate text-xs text-gray-500"
                            title={supplier.rejectionReason}
                          >
                            {supplier.rejectionReason}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-5 py-4">
                        {supplier.isPublicVisible ? (
                          <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {verificationScore}/3 complete
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          ID, background, premises
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {supplier.suburb || "No base suburb"}
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-gray-500">
                          {serviceSuburbs.length > 0
                            ? serviceSuburbs.slice(0, 3).join(", ")
                            : "No service suburbs"}
                          {serviceSuburbs.length > 3
                            ? ` +${serviceSuburbs.length - 3} more`
                            : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {activeServices.length > 0 ? (
                          <div className="flex max-w-xs flex-wrap gap-1">
                            {activeServices.map((service) => (
                              <span
                                key={service.service}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                              >
                                {formatServiceName(service.service)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No services</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}