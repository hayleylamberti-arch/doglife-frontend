import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {

  const navigate = useNavigate();

  const suburbs = [
    "Sandton",
    "Fourways",
    "Midrand",
    "Pretoria",
    "Rosebank",
    "Centurion",
    "Randburg"
  ];

  const [location, setLocation] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSuburbs = suburbs.filter((suburb) =>
    suburb.toLowerCase().includes(location.toLowerCase())
  );

  const handleSearch = () => {
    navigate(`/search?location=${encodeURIComponent(location)}`);
  };

  const selectSuburb = (suburb: string) => {
    setLocation(suburb);
    setShowDropdown(false);
  };

  return (
    <section className="py-20 text-center bg-white">

      <div className="max-w-3xl mx-auto px-6">

        <div className="mb-4 text-sm text-blue-600 font-medium">
          🐾 Now Launching in Gauteng
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          Find trusted dog services in your neighbourhood
        </h1>

        <p className="text-gray-600 mb-8">
          Compare top-rated dog walkers, groomers, and trainers recommended by
          local pet owners.
        </p>

        {/* Search Bar */}

        <div className="relative flex flex-col sm:flex-row gap-3 justify-center">

          <div className="relative w-full sm:w-80">

            <input
              type="text"
              placeholder="Enter your suburb (e.g. Sandton)"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowDropdown(true);
              }}
              className="border rounded-lg px-4 py-3 w-full"
            />

            {showDropdown && location && (
              <div className="absolute left-0 right-0 bg-white border rounded-lg mt-1 shadow-lg z-10">

                {filteredSuburbs.map((suburb) => (
                  <div
                    key={suburb}
                    onClick={() => selectSuburb(suburb)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {suburb}
                  </div>
                ))}

              </div>
            )}

          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Find Services
          </button>

        </div>

        <div className="mt-6 text-sm text-gray-500">
          Popular: Sandton • Fourways • Midrand • Pretoria
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 text-sm text-gray-600">

          <div>✔ Verified Providers</div>

          <div>⭐ Rated by Local Dog Owners</div>

          <div>📍 Local Neighbourhood Services</div>

        </div>

      </div>

    </section>
  );
}