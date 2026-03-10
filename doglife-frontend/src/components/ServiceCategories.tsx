import { useNavigate } from “react-router-dom”

export default function ServiceCategories() {

const navigate = useNavigate()

const services = [
{ name: “Dog Walking”, icon: “🐕” },
{ name: “Grooming”, icon: “✂️” },
{ name: “Training”, icon: “🎓” },
{ name: “Boarding”, icon: “🏡” },
{ name: “Mobile Vet”, icon: “🩺” },
{ name: “Transport”, icon: “🚕” }
]

const goToService = (serviceName: string) => {
navigate(/search?service=${encodeURIComponent(serviceName)})
}

return (

   <div className="max-w-6xl mx-auto px-6">

    <h2 className="text-3xl font-bold text-center mb-10">
      Popular Services
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

      {services.map((service) => (

        <div
          key={service.name}
          onClick={() => goToService(service.name)}
          className="cursor-pointer bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md hover:scale-[1.02] transition"
        >

          <div className="text-3xl mb-2">
            {service.icon}
          </div>

          <p className="font-medium">
            {service.name}
          </p>

        </div>

      ))}

    </div>

  </div>

</section> 
)
}

