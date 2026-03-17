export default function Pricing() {
  return (
    <section className="py-20 bg-gray-50">

      <div className="max-w-6xl mx-auto px-6 text-center">

        <h2 className="text-3xl font-bold mb-4">
          Simple, Transparent Pricing
        </h2>

        <p className="text-gray-600 mb-12">
          Choose the perfect plan for your needs
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
              <li>Unlimited search</li>
              <li>Compare providers</li>
              <li>Read reviews</li>
              <li>Basic messaging</li>
            </ul>

          </div>

          <div className="border rounded-xl p-8 bg-white">
            <h3 className="text-xl font-semibold mb-4">
              Service Providers
            </h3>

            <p className="text-3xl font-bold mb-4">
              From R149/month
            </p>

            <ul className="space-y-2 text-gray-600">
              <li>Business profile</li>
              <li>Customer bookings</li>
              <li>Search visibility</li>
              <li>Marketing tools</li>
            </ul>

          </div>

        </div>

      </div>

    </section>
  );
}