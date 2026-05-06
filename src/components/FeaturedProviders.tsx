export default function FeaturedProviders() {
  const providers = [
    {
      name: "A Floor of Dogs",
      location: "Gauteng",
      service: "Preferred Supplier",
      rating: "Preferred",
      reviews: null,
      price: "View services",
      image: "/images/providers/a-floor-of-dogs.jpg",
      isPreferred: true,
      isPlaceholder: false,
    },
    {
      name: "Dog Walking Providers",
      location: "Launching soon",
      service: "Dog Walking",
      rating: "Coming soon",
      reviews: null,
      price: "Join the waitlist",
      image: "/images/providers/placeholder-dog-care.jpg",
      isPreferred: false,
      isPlaceholder: true,
    },
    {
      name: "Dog Grooming Providers",
      location: "Launching soon",
      service: "Dog Grooming",
      rating: "Coming soon",
      reviews: null,
      price: "Join the waitlist",
      image: "/images/providers/placeholder-grooming.jpg",
      isPreferred: false,
      isPlaceholder: true,
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">
          Trusted dog service providers in Gauteng
        </h2>

        <p className="text-center text-gray-600 mb-10">
          We’re onboarding verified local providers suburb by suburb.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition"
            >
              <div className="flex items-center mb-4">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-12 h-12 rounded-full mr-3 object-cover"
                />

                <div>
                  <h3 className="text-lg font-semibold">
                    {provider.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    📍 {provider.location}
                  </p>
                </div>
              </div>

              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mb-3">
                {provider.service}
              </span>

              <p className="text-sm mb-3">
                {provider.isPreferred
                  ? "⭐ Preferred DogLife supplier"
                  : "🚀 Provider category opening soon"}
              </p>

              <p className="font-semibold text-blue-600">
                {provider.price}
              </p>

              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={provider.isPlaceholder}
              >
                {provider.isPreferred ? "View Profile" : "Coming Soon"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}