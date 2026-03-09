import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NeighbourhoodWaitlist() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-xl mx-auto px-6 text-center">

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Want DogLife in your neighbourhood?
        </h2>

        <p className="text-gray-600 mb-8">
          We're launching in Gauteng first. Want DogLife in your suburb?
Join the waitlist and we'll notify you when we launch near you.
        </p>

        <div className="space-y-4">
          <Input placeholder="Enter your suburb" />

          <Input placeholder="Enter your email" type="email" />

          <Button className="w-full">
            Join the Waitlist
          </Button>
        </div>

      </div>
    </section>
  )
}