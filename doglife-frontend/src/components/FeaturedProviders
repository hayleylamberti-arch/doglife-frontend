export default function FeaturedProviders() {

  const providers = [
    {
      name: "Sarah's Dog Walking",
      location: "Sandton, Johannesburg",
      price: "From R150/walk",
    },
    {
      name: "Mike's Dog Training",
      location: "Cape Town",
      price: "From R400/session",
    },
    {
      name: "Pawsome Grooming",
      location: "Pretoria",
      price: "From R300/groom",
    },
  ];

  return (
    <section className="py-20 bg-white">

      <div className="max-w-6xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-center mb-12">
          Top-Rated Service Providers
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          {providers.map((provider) => (
            <div
              key={provider.name}
              className="border rounded-xl p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold mb-1">
                {provider.name}
              </h3>

              <p className="text-sm text-gray-500 mb-4">
                {provider.location}
              </p>

              <p className="font-medium">
                {provider.price}
              </p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}