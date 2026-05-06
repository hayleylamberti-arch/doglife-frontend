import { useNavigate } from "react-router-dom";

export default function Suburbs() {
  const navigate = useNavigate();

  const suburbs = [
    "Sandton",
    "Fourways",
    "Midrand",
    "Rosebank",
    "Randburg",
    "Centurion",
    "Pretoria",
  ];

  const handleClick = (suburb: string) => {
    navigate(`/search?suburb=${encodeURIComponent(suburb)}`);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold mb-3">
          Browse dog services in popular areas
        </h2>

        <p className="text-gray-600 mb-8">
          Find trusted dog walkers, groomers and trainers near you.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {suburbs.map((suburb) => (
            <button
              key={suburb}
              type="button"
              onClick={() => handleClick(suburb)}
              className="border rounded-lg py-3 hover:bg-gray-50 cursor-pointer transition"
            >
              {suburb}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}