import { useNavigate } from "react-router-dom"

export default function ServiceCategories() {
  const navigate = useNavigate()

  const services = [
    { name: "Dog Walking", value: "WALKING", icon: "🐕" },
    { name: "Dog Grooming", value: "GROOMING", icon: "✂️" },
    { name: "Dog Training", value: "TRAINING", icon: "🎓" },
    { name: "Boarding", value: "BOARDING", icon: "🏡" },
    { name: "Mobile Vet", value: "MOBILE_VET", icon: "🩺" },
    { name: "Pet Transport", value: "PET_TRANSPORT", icon: "🚗" },
  ]

  const goToService = (serviceValue: string) => {
    navigate(`/search?service=${encodeURIComponent(serviceValue)}`)
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-center mb-3">
        What does your dog need?
      </h2>

      <p className="text-gray-600 text-center mb-10">
        Find trusted local providers for everyday care, grooming, training and transport.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <button
            key={service.value}
            type="button"
            onClick={() => goToService(service.value)}
            className="cursor-pointer bg-white p-8 rounded-2xl shadow-sm text-center 
                       hover:shadow-lg hover:-translate-y-1 hover:scale-[1.03]
                       transition-all duration-200"
          >
            <div className="text-4xl mb-3">
              {service.icon}
            </div>

            <p className="font-semibold text-gray-800">
              {service.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}