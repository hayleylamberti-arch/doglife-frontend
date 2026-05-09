export default function FAQ() {
  const questions = [
    {
      question: "Is DogLife free for dog owners?",
      answer:
        "Yes. Dog owners can search, compare and request bookings with local dog service providers for free.",
    },
    {
      question: "How do payments work?",
      answer:
        "During DogLife's launch phase, payments are arranged directly with the supplier once a booking is confirmed. DogLife does not currently hold customer funds or process marketplace payments.",
    },
    {
      question: "Are all providers verified?",
      answer:
        "Providers are reviewed before being listed on DogLife. Preferred and approved providers are marked clearly on their profiles.",
    },
    {
      question: "Which areas does DogLife cover?",
      answer:
        "DogLife is launching in Gauteng first, starting with selected suburbs including Sandton, Fourways, Midrand, Rosebank, Randburg, Centurion and Pretoria.",
    },
    {
      question: "How do bookings work?",
      answer:
        "Search by suburb or service, choose a provider, then submit a booking request. The provider can confirm availability before the booking goes ahead.",
    },
    {
      question: "What if my suburb is not available yet?",
      answer:
        "Join the neighbourhood waitlist and we'll notify you when DogLife launches services in your area.",
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">
          Frequently asked questions
        </h2>

        <p className="text-center text-gray-600 mb-10">
          Everything dog owners need to know before using DogLife.
        </p>

        <div className="space-y-4">
          {questions.map((item) => (
            <div key={item.question} className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                {item.question}
              </h3>

              <p className="text-gray-600 text-sm">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}