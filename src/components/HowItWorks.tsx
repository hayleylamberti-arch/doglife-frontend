export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">

      <div className="max-w-6xl mx-auto px-6 text-center">

        <h2 className="text-3xl font-bold mb-4">
          How DogLife Works
        </h2>

        <p className="text-gray-600 mb-12">
          Simple steps to connect with trusted dog service providers
        </p>

        <div className="grid md:grid-cols-3 gap-10">

          <div>
            <h3 className="text-xl font-semibold mb-2">
              Search & Compare
            </h3>
            <p className="text-gray-600">
              Browse verified providers in your area, compare prices and read reviews.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              Book & Pay
            </h3>
            <p className="text-gray-600">
              Select your preferred provider and schedule your service easily.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              Enjoy & Review
            </h3>
            <p className="text-gray-600">
              Relax while your dog enjoys great care, then share your experience.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}