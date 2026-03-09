export default function FeaturedProviders() {

  const providers = [
    {
      name: "Sarah's Dog Walking",
      location: "Sandton, Johannesburg",
      rating: "5.0",
      reviews: 127,
      price: "From R150/walk",
    },
    {
      name: "Mike's Dog Training",
      location: "Pretoria, Gauteng",
      rating: "4.9",
      reviews: 89,
      price: "From R400/session",
    },
    {
      name: "Pawsome Grooming",
      location: "Midrand, Gauteng",
      rating: "4.8",
      reviews: 156,
      price: "From R300/groom",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">

      <div className="max-w-6xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-center mb-10">
          Top Rated Service Providers
        </h2>

        <p className="text-center text-gray-600 mb-12">
          Trusted by dog owners across South Africa
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          {providers.map((provider, index) => (

            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition"
            >

              <h3 className="text-lg font-semibold mb-2">
                {provider.name}
              </h3>

              <p className="text-sm text-gray-500 mb-2">
                📍 {provider.location}
              </p>

              <p className="text-sm mb-3">
                ⭐ {provider.rating} ({provider.reviews} reviews)
              </p>

              <p className="font-medium text-blue-600">
                {provider.price}
              </p>

              <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                View Profile
              </button>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}