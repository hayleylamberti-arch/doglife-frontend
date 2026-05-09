import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const FLOOR_OF_DOGS_ID = "cmnvuhhe800012jis3k3klfk2"

type FeaturedSupplier = {
  logoUrl?: string | null
}

export default function FeaturedProviders() {
  const navigate = useNavigate()
  const [floorOfDogs, setFloorOfDogs] = useState<FeaturedSupplier | null>(null)

  useEffect(() => {
    async function loadSupplier() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/suppliers/${FLOOR_OF_DOGS_ID}`)
        const data = await res.json()

        if (data?.ok && data?.supplier) {
          setFloorOfDogs(data.supplier)
        }
      } catch (error) {
        console.error("Failed to load featured supplier:", error)
      }
    }

    loadSupplier()
  }, [])

  const providers = [
    {
      name: "A Floor of Dogs",
      location: "Kyalami, Gauteng",
      service: "Preferred Supplier",
      price: "Boarding, training and grooming",
      profilePath: `/supplier/${FLOOR_OF_DOGS_ID}`,
      logoUrl: floorOfDogs?.logoUrl,
      fallbackIcon: "🐾",
      isPreferred: true,
      isPlaceholder: false,
    },
    {
      name: "Dog Walking Providers",
      location: "Launching soon",
      service: "Dog Walking",
      price: "Join the waitlist",
      profilePath: null,
      logoUrl: null,
      fallbackIcon: "🐕",
      isPreferred: false,
      isPlaceholder: true,
    },
    {
      name: "Dog Grooming Providers",
      location: "Launching soon",
      service: "Dog Grooming",
      price: "Join the waitlist",
      profilePath: null,
      logoUrl: null,
      fallbackIcon: "✂️",
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
                {provider.logoUrl ? (
                  <img
                    src={provider.logoUrl}
                    alt={`${provider.name} logo`}
                    className="w-12 h-12 rounded-full mr-3 object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full mr-3 bg-blue-50 flex items-center justify-center text-2xl">
                    {provider.fallbackIcon}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold">{provider.name}</h3>

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
                type="button"
                onClick={() => {
                  if (provider.profilePath) {
                    navigate(provider.profilePath)
                  }
                }}
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