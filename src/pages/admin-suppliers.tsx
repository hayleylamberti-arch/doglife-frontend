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
  websiteUrl?: string | null;
  aboutServices?: string | null;
  approvalStatus: SupplierStatus;
  isPublicVisible?: boolean;
  approvedAt?: string | null;
  submittedAt?: string | null;
  rejectionReason?: string | null;
  identityVerified?: boolean;
  backgroundCheckVerified?: boolean;
  premisesVerified?: boolean;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  operatingAreas?: Array<{
    suburb?: {
      id: string;
      suburbName: string;
      city?: string | null;
      province?: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: SupplierStatus) {
  return status.replace(/_/g, " ");
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
    case "DRAFT":
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

export default function AdminSuppliersPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | SupplierStatus>("ALL");
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

  const suppliers: SupplierItem[] = Array.isArray(data?.suppliers) ? data.suppliers : [];

  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => {
      const aSubmitted = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bSubmitted = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;

      if (bSubmitted !== aSubmitted) return bSubmitted - aSubmitted;

      return String(a.businessName || "").localeCompare(String(b.businessName || ""));
    });
  }, [suppliers]);

  const approveMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      await api.post(`/api/admin/suppliers/${supplierId}/approve`);
    },
    onMutate: (supplierId) => {
      setActiveSupplierId(supplierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    },
    onSettled: () => {
      setActiveSupplierId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      supplierId,
      reason,
    }: {
      supplierId: string;
      reason?: string;
    }) => {
      await api.post(`/api/admin/suppliers/${supplierId}/reject`, {
        reason,
      });
    },
    onMutate: ({ supplierId }) => {
      setActiveSupplierId(supplierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    },
    onSettled: () => {
      setActiveSupplierId(null);
    },
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Review</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review supplier profiles, approve listings, and manage rejections.
          </p>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as "ALL" | SupplierStatus)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-6 shadow">Loading suppliers...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load suppliers.
        </div>
      ) : sortedSuppliers.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow text-gray-500">
          No suppliers found for this status.
        </div>
      ) : (
        <div className="space-y-5">
          {sortedSuppliers.map((supplier) => {
            const serviceSuburbs = getServiceSuburbs(supplier);
            const isBusy = activeSupplierId === supplier.id;
            const isApproved = supplier.approvalStatus === "APPROVED";

            return (
              <div
                key={supplier.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/admin/suppliers/${supplier.id}`}
                        className="text-2xl font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {supplier.businessName || "Unnamed supplier"}
                      </Link>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                          supplier.approvalStatus
                        )}`}
                      >
                        {formatStatus(supplier.approvalStatus)}
                      </span>

                      {supplier.isPublicVisible ? (
                        <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          Publicly visible
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {supplier.user?.email || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {supplier.businessPhone || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Base suburb:</span>{" "}
                        {supplier.suburb || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Submitted:</span>{" "}
                        {formatDate(supplier.submittedAt)}
                      </p>
                      <p>
                        <span className="font-medium">Approved:</span>{" "}
                        {formatDate(supplier.approvedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
  to={`/admin/suppliers/${supplier.id}`}
  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
>
  View details
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
                      {isBusy ? "Working..." : isApproved ? "Suspend / Reject" : "Reject"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Profile summary
                    </h3>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">About:</span>{" "}
                        {supplier.aboutServices || "—"}
                      </p>

                      <p>
                        <span className="font-medium">Website:</span>{" "}
                        {supplier.websiteUrl ? (
                          <a
                            href={supplier.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {supplier.websiteUrl}
                          </a>
                        ) : (
                          "—"
                        )}
                      </p>

                      <p>
                        <span className="font-medium">Service suburbs:</span>{" "}
                        {serviceSuburbs.length > 0 ? serviceSuburbs.join(", ") : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Verification status
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          supplier.identityVerified
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Identity {supplier.identityVerified ? "Verified" : "Not verified"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          supplier.backgroundCheckVerified
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Background {supplier.backgroundCheckVerified ? "Verified" : "Not verified"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          supplier.premisesVerified
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Premises {supplier.premisesVerified ? "Verified" : "Not verified"}
                      </span>
                    </div>

                    {supplier.rejectionReason ? (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <span className="font-medium">Rejection reason:</span>{" "}
                        {supplier.rejectionReason}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}