export default function Pricing() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Join DogLife for Free
        </h2>

        <p className="text-gray-600 mb-12">
          Dog owners search for free. Service providers can start free and upgrade when they grow.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="border rounded-xl p-8 bg-white">
            <h3 className="text-xl font-semibold mb-4">
              Dog Owners
            </h3>

            <p className="text-3xl font-bold mb-4">
              R0
            </p>

            <ul className="space-y-2 text-gray-600">
              <li>Search trusted local providers</li>
              <li>Compare services and pricing</li>
              <li>Read provider reviews</li>
              <li>Send booking requests</li>
            </ul>
          </div>

          <div className="border rounded-xl p-8 bg-white">
            <h3 className="text-xl font-semibold mb-4">
              Service Providers
            </h3>

            <p className="text-3xl font-bold mb-2">
              Start Free
            </p>

            <p className="text-gray-500 mb-4">
              Upgrade from R149/month when you are ready to grow
            </p>

            <ul className="space-y-2 text-gray-600">
              <li>Free business profile</li>
              <li>Get discovered by local dog owners</li>
              <li>Receive customer booking requests</li>
              <li>First 3 months free for launch partners</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}