import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const [suburb, setSuburb] = useState("");

  const handleSearch = () => {
    // 🚀 TEMP: until search page exists
    // You can later change this to /search
    navigate("/auth/register");
  };

  const handleBecomeProvider = () => {
    navigate("/auth/register?role=supplier");
  };

  return (
    <section className="text-center py-20 px-6 bg-gray-50">

      <h1 className="text-4xl font-bold mb-4">
        Find trusted dog services in your neighbourhood
      </h1>

      <p className="text-gray-600 mb-6">
        Compare top-rated dog walkers, groomers, and trainers recommended by local pet owners.
      </p>

      {/* SEARCH */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 mb-4">
        <input
          className="border p-3 rounded w-full sm:w-72"
          placeholder="Enter your suburb (e.g. Sandton)"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition"
        >
          Find Services
        </button>
      </div>

      {/* CTA */}
      <button
        onClick={handleBecomeProvider}
        className="border px-6 py-3 rounded hover:bg-gray-100 transition"
      >
        Become a Provider
      </button>

      <p className="text-sm text-gray-500 mt-6">
        Popular: Sandton • Fourways • Midrand • Pretoria
      </p>

    </section>
  );
}