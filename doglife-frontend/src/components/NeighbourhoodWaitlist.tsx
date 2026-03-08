import { Link } from "react-router-dom";

export default function NeighbourhoodWaitlist() {
  return (
    <section className="py-20 bg-gradient-to-r from-doglife-primary to-blue-600 text-white">

      <div className="max-w-4xl mx-auto px-6 text-center">

        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          Want DogLife in your neighbourhood?
        </h2>

        <p className="text-lg opacity-90 mb-8">
          We're launching city by city starting in Gauteng.  
          Join the waitlist and we'll notify you when DogLife launches near you.
        </p>

        <Link
          to="/prospect-enquiry"
          className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
        >
          Join the Waitlist
        </Link>

        <p className="mt-6 text-sm opacity-80">
          Gauteng first. South Africa next.
        </p>

      </div>

    </section>
  );
}