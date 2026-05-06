export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">
          How DogLife works
        </h2>

        <p className="text-gray-600 mb-12">
          Find, compare and book trusted dog care in your suburb.
        </p>

        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              1. Search your suburb
            </h3>
            <p className="text-gray-600">
              Find dog walkers, groomers, trainers and care providers near you.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              2. Compare providers
            </h3>
            <p className="text-gray-600">
              View services, pricing, reviews and provider profiles before you choose.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              3. Book with confidence
            </h3>
            <p className="text-gray-600">
              Secure your booking and know your dog is in trusted local hands.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}