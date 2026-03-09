export default function Suburbs() {

  const suburbs = [
    "Sandton",
    "Fourways",
    "Midrand",
    "Rosebank",
    "Randburg",
    "Centurion",
    "Pretoria"
  ];

  return (
    <section className="py-16 bg-white">

      <div className="max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-2xl font-bold mb-6">
          Find Dog Services Near You
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {suburbs.map((suburb) => (

            <div
              key={suburb}
              className="border rounded-lg py-3 hover:bg-gray-50 cursor-pointer"
            >
              {suburb}
            </div>

          ))}

        </div>

      </div>

    </section>
  );
}