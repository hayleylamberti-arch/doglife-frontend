import { useNavigate } from "react-router-dom"

export default function ServiceCategories() {
  const navigate = useNavigate()

  const services = [
    { name: "Dog Walking", icon: "🐕" },
    { name: "Grooming", icon: "✂️" },
    { name: "Training", icon: "🎓" },
    { name: "Boarding", icon: "🏡" },
    { name: "Mobile Vet", icon: "🩺" },
    { name: "Transport", icon: "🚗" }
  ]

  const goToService = (serviceName: string) => {
    navigate(`/search?service=${encodeURIComponent(serviceName)}`)
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">

      <h2 className="text-3xl font-bold text-center mb-10">
        Popular Services
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

        {services.map((service) => (
          <div
            key={service.name}
            onClick={() => goToService(service.name)}
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

          </div>
        ))}

      </div>

    </section>
  )
}