import VerificationBadge, {
  type VerificationBadgeType,
} from "@/components/suppliers/VerificationBadge";

type VerificationCard = {
  type: VerificationBadgeType;
  title: string;
  meaning: string;
  notMeaning?: string;
};

const verificationCards: VerificationCard[] = [
  {
    type: "APPROVED_SUPPLIER",
    title: "Approved Supplier",
    meaning:
      "This supplier has completed the required DogLife profile and service setup and has been approved to list on the platform.",
    notMeaning:
      "It does not automatically mean every possible background, premises, or vehicle check has been completed.",
  },
  {
    type: "IDENTITY_VERIFIED",
    title: "Identity Verified",
    meaning:
      "DogLife has verified the identity of the person behind the supplier profile.",
    notMeaning:
      "It does not by itself confirm business registration, service quality, or premises standards.",
  },
  {
    type: "BACKGROUND_CHECK_VERIFIED",
    title: "Background Check Verified",
    meaning:
      "DogLife has reviewed the supplier’s criminal/background screening result.",
    notMeaning:
      "It does not guarantee future conduct or replace normal owner judgment.",
  },
  {
    type: "TRADING_DETAILS_VERIFIED",
    title: "Trading Details Verified",
    meaning:
      "DogLife has reviewed evidence that the supplier is actively trading and can be traced.",
    notMeaning:
      "It does not necessarily mean the supplier is a formally registered company.",
  },
  {
    type: "REGISTERED_BUSINESS_VERIFIED",
    title: "Registered Business Verified",
    meaning:
      "DogLife has reviewed formal business registration documents for this supplier.",
    notMeaning:
      "It does not by itself confirm premises quality or service-specific safety standards.",
  },
  {
    type: "PREMISES_VERIFIED",
    title: "Premises Verified",
    meaning:
      "DogLife has reviewed the location where dogs are cared for or where services operate from.",
    notMeaning:
      "It does not mean the premises are inspected continuously or permanently risk-free.",
  },
  {
    type: "VEHICLE_VERIFIED",
    title: "Vehicle Verified",
    meaning:
      "DogLife has reviewed the vehicle used for transport or mobile services.",
    notMeaning:
      "It does not replace owner review of suitability for a specific dog or trip.",
  },
  {
    type: "SERVICE_SETUP_VERIFIED",
    title: "Service Setup Verified",
    meaning:
      "DogLife has reviewed service-specific safety and operating information.",
    notMeaning:
      "It does not guarantee that every owner experience will be identical.",
  },
];

const serviceChecks = [
  {
    title: "Boarding & Daycare",
    checks: [
      "Premises photos and/or location details",
      "Vaccination and emergency process",
      "Capacity and safety setup",
      "Care environment and supervision information",
    ],
  },
  {
    title: "Grooming",
    checks: [
      "Equipment or mobile setup",
      "Before/after portfolio where available",
      "Service menu and pricing setup",
      "Hygiene and process information",
    ],
  },
  {
    title: "Walking, Pet Sitting & Training",
    checks: [
      "Identity and background trust checks",
      "Service area confirmation",
      "Handling and emergency process",
      "References and qualifications where applicable",
    ],
  },
  {
    title: "Pet Transport",
    checks: [
      "Vehicle details",
      "Transport setup and safety process",
      "Handling procedure for dogs in transit",
      "Service-specific operating information",
    ],
  },
];

export default function TrustAndSafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              DogLife Trust & Safety
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
              How DogLife verifies suppliers
            </h1>

            <p className="mt-4 text-lg leading-8 text-gray-600">
              DogLife verifies suppliers in layers so owners can understand
              exactly what has been checked — from identity and background
              screening to trading details, premises, vehicles, and
              service-specific setup.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <VerificationBadge type="APPROVED_SUPPLIER" />
              <VerificationBadge type="IDENTITY_VERIFIED" />
              <VerificationBadge type="BACKGROUND_CHECK_VERIFIED" />
              <VerificationBadge type="TRADING_DETAILS_VERIFIED" />
              <VerificationBadge type="PREMISES_VERIFIED" />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            Why DogLife uses different trust levels
          </h2>

          <div className="mt-4 space-y-4 text-gray-600">
            <p>
              Not every supplier operates in the same way. Some are sole
              proprietors, some are formally registered businesses, and some
              provide higher-trust services like boarding, daycare, or pet
              transport.
            </p>
            <p>
              That is why DogLife does not rely on one vague “verified” label.
              Instead, suppliers can earn different badges depending on the
              checks that have actually been completed.
            </p>
            <p>
              This helps owners make better decisions and gives a clearer,
              more honest view of supplier trust.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            What each verification badge means
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {verificationCards.map((card) => (
              <article
                key={card.type}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
              >
                <VerificationBadge type={card.type} />

                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {card.title}
                </h3>

                <p className="mt-3 text-gray-700">{card.meaning}</p>

                {card.notMeaning ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">
                      Important:
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      {card.notMeaning}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            Different services may require different checks
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {serviceChecks.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h3>

                <ul className="mt-4 space-y-2 text-gray-600">
                  {section.checks.map((check) => (
                    <li key={check} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">
            What DogLife checks for businesses
          </h2>

          <div className="mt-4 space-y-4 text-gray-600">
            <p>
              DogLife may review formal business registration where it exists,
              but not all good suppliers operate as formally registered
              companies. Some are sole proprietors or small operators with
              valid trading activity but no CIPC registration.
            </p>

            <p>
              In those cases, DogLife may review trading details instead,
              including proof of address, trading evidence, supporting
              documents, references, and service-specific setup.
            </p>

            <p>
              A website or social page may support trust, but it should not be
              treated as the only proof that a business is legitimate.
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
            details, reviews, suitability for their dog, and any service-specific
            requirements before booking.
          </p>
        </section>
      </div>
    </div>
  );
}