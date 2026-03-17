export default function TrustSection() {

  return (
    <section className="py-16 bg-gray-50">

      <div className="max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-2xl font-bold mb-10">
          Why DogLife?
        </h2>

        <div className="grid md:grid-cols-4 gap-6 text-sm">

          <div>
            🛡️
            <p className="font-semibold mt-2">Verified Providers</p>
          </div>

          <div>
            ⭐
            <p className="font-semibold mt-2">Rated by Dog Owners</p>
          </div>

          <div>
            💬
            <p className="font-semibold mt-2">Secure Messaging</p>
          </div>

          <div>
            📍
            <p className="font-semibold mt-2">Local Neighbourhood Services</p>
          </div>

        </div>

      </div>

    </section>
  );
}