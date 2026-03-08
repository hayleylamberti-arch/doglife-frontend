import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="py-20 text-center bg-white">

      <div className="max-w-3xl mx-auto px-6">

        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          Find trusted dog services in your neighbourhood
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Compare top-rated dog walkers, groomers, trainers and more — all recommended by local pet owners.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <Link to="/search">
            <Button className="w-full sm:w-auto px-8 py-3 text-lg">
              Find Services Near Me
            </Button>
          </Link>

          <Link to="/supplier-onboarding">
            <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-lg">
              Become a Provider
            </Button>
          </Link>

        </div>

      </div>

    </section>
  );
}