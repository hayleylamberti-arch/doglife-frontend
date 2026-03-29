import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const [suburb, setSuburb] = useState("");

  return (
    <section className="text-center py-20 px-6 bg-gray-50">

      <h1 className="text-4xl font-bold mb-4">
        Find trusted dog services in your neighbourhood
      </h1>

      <p className="text-gray-600 mb-6">
        Compare top-rated dog walkers, groomers, and trainers recommended by local pet owners.
      </p>

      {/* SEARCH */}
      <div className="flex justify-center gap-2 mb-4">
        <input
          className="border p-3 rounded w-72"
          placeholder="Enter your suburb (e.g. Sandton)"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
        />

        <button
          onClick={() => navigate("/search")}
          className="bg-blue-600 text-white px-4 py-3 rounded"
        >
          Find Services
        </button>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/auth/register?role=supplier")}
        className="border px-6 py-3 rounded"
      >
        Become a Provider
      </button>

      <p className="text-sm text-gray-500 mt-6">
        Popular: Sandton • Fourways • Midrand • Pretoria
      </p>

    </section>
  );
}