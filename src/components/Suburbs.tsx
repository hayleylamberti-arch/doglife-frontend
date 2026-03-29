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
    // 🚀 TEMP FIX: route to working page
    // Later upgrade to: /search?suburb=...
    navigate("/auth/register", {
      state: { suburb },
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">
          Find Dog Services Near You
        </h2>

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