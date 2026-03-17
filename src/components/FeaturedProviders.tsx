export default function FeaturedProviders() {

  const providers = [
  {
    name: "Sarah's Dog Walking",
    location: "Sandton, Johannesburg",
    service: "Dog Walker",
    rating: "5.0",
    reviews: 127,
    price: "From R150/walk",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Mike's Dog Training",
    location: "Pretoria, Gauteng",
    service: "Dog Trainer",
    rating: "4.9",
    reviews: 89,
    price: "From R400/session",
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Pawsome Grooming",
    location: "Midrand, Gauteng",
    service: "Dog Groomer",
    rating: "4.8",
    reviews: 156,
    price: "From R300/groom",
    image: "https://randomuser.me/api/portraits/women/65.jpg"
  }
];

  return (
    <section className="py-20 bg-gray-50">

      <div className="max-w-6xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-center mb-4">
          Top Rated Service Providers in Gauteng
        </h2>

        <p className="text-center text-gray-600 mb-10">
          Trusted by dog owners across South Africa
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          {providers.map((provider, index) => (

          <div
  key={index}
  className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition"
>

  {/* Provider Header */}

  <div className="flex items-center mb-4">

    <img
      src={provider.image}
      alt={provider.name}
      className="w-12 h-12 rounded-full mr-3"
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

  {/* Service Badge */}

  <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mb-3">
    {provider.service}
  </span>

  {/* Rating */}

  <p className="text-sm mb-3">
    ⭐ {provider.rating} ({provider.reviews} reviews)
  </p>

  {/* Price */}

  <p className="font-semibold text-blue-600">
    {provider.price}
  </p>

  {/* CTA */}

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