import VerificationBadge from "@/components/supplier/VerificationBadge";

const trustLevels = [
  {
    type: "APPROVED_SUPPLIER" as const,
    title: "Approved Supplier",
    meaning:
      "This supplier has completed the required DogLife profile and service setup and has been reviewed and approved to list on the platform.",
    extra:
      "This is the starting trust level on DogLife and allows good suppliers to begin building their profile, reviews, and booking history.",
  },
  {
    type: "IDENTITY_VERIFIED" as const,
    title: "Identity Verified",
    meaning:
      "DogLife has verified the identity of the person behind the supplier profile.",
    extra:
      "This gives owners added confidence that the supplier is a real, traceable person.",
  },
  {
    type: "SERVICE_SETUP_VERIFIED" as const,
    title: "Fully Verified",
    meaning:
      "DogLife has completed additional trust checks relevant to the supplier’s service, which may include trading details, background screening, premises, vehicle, or service-specific setup.",
    extra:
      "Not every supplier needs the same checks. Higher-trust or higher-risk services may require more verification.",
  },
];

const examples = [
  {
    title: "Boarding & Daycare",
    text: "May include premises, safety, capacity, and emergency process checks.",
  },
  {
    title: "Grooming",
    text: "May include equipment, hygiene, portfolio, or mobile setup checks.",
  },
  {
    title: "Walking, Pet Sitting & Training",
    text: "May include identity, background, references, and service process checks.",
  },
  {
    title: "Pet Transport",
    text: "May include vehicle, transport setup, and service safety checks.",
  },
];

export default function TrustAndSafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              DogLife Trust &amp; Safety
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
              How DogLife verifies suppliers
            </h1>

            <p className="mt-4 text-lg leading-8 text-gray-600">
              DogLife verifies suppliers in layers so owners can book with more
              confidence while still giving good service providers a simple way
              to get started on the platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <VerificationBadge type="APPROVED_SUPPLIER" />
              <VerificationBadge type="IDENTITY_VERIFIED" />
              <span
                className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
                title="DogLife has completed additional trust checks relevant to the service."
              >
                Fully Verified
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            Our simple trust levels
          </h2>

          <p className="mt-4 max-w-4xl text-gray-600">
            Not every supplier operates in the same way. Some are sole
            proprietors, some are established businesses, and some offer
            higher-trust services like boarding, daycare, or pet transport.
            That is why DogLife uses a layered approach instead of one vague
            “verified” label.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {trustLevels.map((level) => (
              <article
                key={level.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                {level.title === "Fully Verified" ? (
                  <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                    Fully Verified
                  </span>
                ) : (
                  <VerificationBadge type={level.type} />
                )}

                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {level.title}
                </h3>

                <p className="mt-3 text-gray-700">{level.meaning}</p>

                <p className="mt-4 text-sm text-gray-600">{level.extra}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            Suppliers can start with Approved Supplier
          </h2>

          <div className="mt-4 space-y-4 text-gray-600">
            <p>
              DogLife is designed so that good suppliers do not need to complete
              every advanced check before they can begin. A supplier can start
              with <strong>Approved Supplier</strong>, build trust over time,
              and then move up to stronger trust levels as more checks are
              completed.
            </p>

            <p>
              This helps DogLife maintain owner trust while still making it
              practical for smaller or newer suppliers to join the platform.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            What Fully Verified may include
          </h2>

          <p className="mt-4 max-w-4xl text-gray-600">
            Fully Verified means DogLife has completed additional checks that
            make sense for the supplier’s service. These checks may differ by
            category.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {examples.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            What DogLife may review behind the scenes
          </h2>

          <div className="mt-4 space-y-4 text-gray-600">
            <p>
              Depending on the supplier and service, DogLife may review
              supporting trust information such as identity, background results,
              trading details, business documents, premises, vehicles, or
              service-specific safety and operating information.
            </p>

            <p>
              Some suppliers may be formally registered businesses, while others
              may be sole proprietors with valid trading activity. DogLife aims
              to apply checks honestly and appropriately, without making the
              process harder than it needs to be.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-8">
          <h2 className="text-2xl font-semibold text-blue-950">
            Important note for owners
          </h2>

          <p className="mt-4 max-w-4xl text-blue-900">
            Verification helps reduce risk, but no process can remove risk
            entirely. Owners should still review supplier profiles, service
            details, reviews, and suitability for their dog before booking.
          </p>
        </section>
      </div>
    </div>
  );
}