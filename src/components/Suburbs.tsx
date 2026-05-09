import { useNavigate } from "react-router-dom";

export default function Suburbs() {
  const navigate = useNavigate();

  const suburbs = [
    "Fourways",
    "Lonehill",
    "Paulshof",
    "Sunninghill",
    "Kyalami",
  ];

  const handleClick = (suburb: string) => {
    navigate(`/search?suburb=${encodeURIComponent(suburb)}`);
  };

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="mb-3 text-2xl font-bold">
          Browse dog services in popular areas
        </h2>

        <p className="mb-8 text-gray-600">
          Find trusted dog walkers, groomers and trainers near you.
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {suburbs.map((suburb) => (
            <button
              key={suburb}
              type="button"
              onClick={() => handleClick(suburb)}
              className="cursor-pointer rounded-lg border py-3 transition hover:bg-gray-50"
            >
              {suburb}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}