import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";

function formatServiceName(value?: string | null) {
  if (!value) return "Service";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "green" | "blue" | "amber" | "red" | "neutral";
}) {
  const styles = {
    green: "border-green-200 bg-green-50 text-green-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-gray-200 bg-gray-50 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function ChecklistItem({
  complete,
  label,
  detail,
}: {
  complete: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          complete
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {complete ? "✓" : "!"}
      </div>

      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {detail ? (
          <p className="mt-1 text-sm text-gray-500">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function VerificationItem({
  label,
  verified,
  description,
}: {
  label: string;
  verified: boolean;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <StatusPill
          label={verified ? "Verified" : "Not yet verified"}
          tone={verified ? "green" : "neutral"}
        />
      </div>
    </div>
  );
}

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6 text-gray-600">
        Loading supplier...
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">
            Unable to load supplier details.
          </p>
        </div>

        <Link
          className="mt-4 inline-block font-medium text-blue-600 hover:underline"
          to="/admin/suppliers"
        >
          ← Back to suppliers
        </Link>
      </div>
    );
  }

  const supplier = data.supplier;

  const activeServices =
    supplier.services?.filter((service: any) => service.isActive !== false) || [];

  const serviceSuburbs =
    supplier.operatingAreas
      ?.map((area: any) => area?.suburb)
      .filter(Boolean) || [];

  const hasBusinessName = Boolean(supplier.businessName?.trim());
  const hasContactDetails = Boolean(
    supplier.businessPhone?.trim() || supplier.user?.mobilePhone?.trim()
  );
  const hasProfileSummary = Boolean(supplier.aboutServices?.trim());
  const hasBaseSuburb = Boolean(supplier.suburb?.trim());
  const hasCoverage = serviceSuburbs.length > 0;
  const hasActiveService = activeServices.length > 0;
  const hasAvailability =
    Array.isArray(supplier.availability) && supplier.availability.length > 0;

  const readinessItems = [
    hasBusinessName,
    hasContactDetails,
    hasProfileSummary,
    hasBaseSuburb,
    hasCoverage,
    hasActiveService,
    hasAvailability,
  ];

  const completedReadinessItems = readinessItems.filter(Boolean).length;
  const readinessPercent = Math.round(
    (completedReadinessItems / readinessItems.length) * 100
  );

  const approvalStatus = supplier.approvalStatus || "UNKNOWN";

  const approvalTone =
    approvalStatus === "APPROVED"
      ? "green"
      : approvalStatus === "SUBMITTED"
        ? "blue"
        : approvalStatus === "REJECTED"
          ? "red"
          : "neutral";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Link
        className="inline-flex items-center font-medium text-blue-600 hover:underline"
        to="/admin/suppliers"
      >
        ← Back to suppliers
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Supplier review
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              {supplier.businessName || "Supplier detail"}
            </h1>

            <p className="mt-2 text-gray-500">
              Review supplier setup, services, coverage and trust information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill
              label={approvalStatus}
              tone={approvalTone as "green" | "blue" | "red" | "neutral"}
            />

            <StatusPill
              label={supplier.isPublicVisible ? "Public" : "Not public"}
              tone={supplier.isPublicVisible ? "green" : "neutral"}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Submitted
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(supplier.submittedAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Approved
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(supplier.approvedAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Account created
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(supplier.user?.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Last login
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(supplier.user?.lastLoginAt)}
            </p>
          </div>
        </div>
      </section>

      {approvalStatus === "REJECTED" && supplier.rejectionReason ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-900">Review feedback</h2>
          <p className="mt-2 text-sm text-red-800">
            {supplier.rejectionReason}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Supplier setup
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Basic setup readiness is separate from DogLife trust verification.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-gray-900">
              {completedReadinessItems}/{readinessItems.length}
            </p>
            <p className="text-sm text-gray-500">
              {readinessPercent}% complete
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <ChecklistItem
            complete={hasBusinessName}
            label="Business name"
            detail={
              hasBusinessName
                ? supplier.businessName
                : "Business name still required."
            }
          />

          <ChecklistItem
            complete={hasContactDetails}
            label="Contact number"
            detail={
              hasContactDetails
                ? supplier.businessPhone ||
                  supplier.user?.mobilePhone ||
                  "Contact number supplied."
                : "Contact number still required."
            }
          />

          <ChecklistItem
            complete={hasProfileSummary}
            label="Business profile"
            detail={
              hasProfileSummary
                ? "Business description has been added."
                : "Business description still required."
            }
          />

          <ChecklistItem
            complete={hasBaseSuburb}
            label="Base suburb"
            detail={
              hasBaseSuburb
                ? supplier.suburb
                : "Base suburb still required."
            }
          />

          <ChecklistItem
            complete={hasCoverage}
            label="Coverage areas"
            detail={
              hasCoverage
                ? `${serviceSuburbs.length} coverage area${
                    serviceSuburbs.length === 1 ? "" : "s"
                  } configured.`
                : "At least one coverage area is still required."
            }
          />

          <ChecklistItem
            complete={hasActiveService}
            label="Active service"
            detail={
              hasActiveService
                ? `${activeServices.length} active service${
                    activeServices.length === 1 ? "" : "s"
                  }.`
                : "At least one active service is required."
            }
          />

          <ChecklistItem
            complete={hasAvailability}
            label="Availability"
            detail={
              hasAvailability
                ? "Supplier availability has been configured."
                : "Availability still needs to be configured."
            }
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Business details
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Contact name</dt>
              <dd className="mt-1 text-gray-900">
                {[supplier.user?.firstName, supplier.user?.lastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-gray-900">
                {supplier.user?.email || "—"}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Business phone</dt>
              <dd className="mt-1 text-gray-900">
                {supplier.businessPhone || supplier.user?.mobilePhone || "—"}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Base suburb</dt>
              <dd className="mt-1 text-gray-900">{supplier.suburb || "—"}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Website</dt>
              <dd className="mt-1">
                {supplier.websiteUrl ? (
                  <a
                    className="break-all font-medium text-blue-600 hover:underline"
                    href={supplier.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {supplier.websiteUrl}
                  </a>
                ) : (
                  <span className="text-gray-900">—</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Account status</dt>
              <dd className="mt-1 text-gray-900">
                {supplier.user?.isActive === false ? "Inactive" : "Active"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Business profile
          </h2>

          <p className="mt-5 whitespace-pre-line text-sm leading-6 text-gray-700">
            {supplier.aboutServices || "No business profile has been added yet."}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Services & coverage
        </h2>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="font-semibold text-gray-900">Services</h3>

            <div className="mt-3 space-y-2">
              {supplier.services?.length ? (
                supplier.services.map((service: any) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4"
                  >
                    <span className="font-medium text-gray-900">
                      {formatServiceName(service.service)}
                    </span>

                    <StatusPill
                      label={
                        service.isActive === false ? "Inactive" : "Active"
                      }
                      tone={
                        service.isActive === false ? "neutral" : "green"
                      }
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No services listed.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Base coverage areas</h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {serviceSuburbs.length ? (
                serviceSuburbs.map((suburb: any) => (
                  <span
                    key={suburb.id || suburb.suburbName}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    {suburb.suburbName}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No base coverage areas listed.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Trust & verification
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Verification is an additional DogLife trust layer and is separate
            from basic supplier approval.
          </p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <VerificationItem
            label="Identity"
            verified={Boolean(supplier.identityVerified)}
            description="Identity verification status."
          />

          <VerificationItem
            label="Background check"
            verified={Boolean(supplier.backgroundCheckVerified)}
            description="Background screening status."
          />

          <VerificationItem
            label="Premises"
            verified={Boolean(supplier.premisesVerified)}
            description="Business premises verification status."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-900">
          Admin review
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          This Sprint 1 page is read-only. Approval, rejection, public
          visibility, verification updates and suspension controls will be
          handled separately so admin write actions can be reviewed safely.
        </p>

        <Link
          to="/admin/suppliers"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return to supplier pipeline
        </Link>
      </section>
    </div>
  );
}
