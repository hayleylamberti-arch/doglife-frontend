export default function ServiceCategories() {

  const services = [
    { icon: "🐕", name: "Dog Walking" },
    { icon: "✂️", name: "Grooming" },
    { icon: "🎓", name: "Training" },
    { icon: "🏡", name: "Boarding" },
    { icon: "🩺", name: "Mobile Vet" },
    { icon: "🚕", name: "Transport" },
  ];

  return (
    <section className="py-20 bg-gray-50">

      <div className="max-w-5xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-center mb-12">
          Popular Services
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">

          {services.map((service) => (

            <div
              key={service.name}
              className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition"
            >

              <div className="text-3xl mb-2">
                {service.icon}
              </div>

              <div className="font-semibold">
                {service.name}
              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}