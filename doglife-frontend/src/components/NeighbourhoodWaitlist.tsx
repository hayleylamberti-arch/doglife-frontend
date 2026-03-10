import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NeighbourhoodWaitlist() {

  const [suburb, setSuburb] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("owner");
  const [serviceType, setServiceType] = useState("");

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

          {/* Owner or Supplier */}
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="w-full border rounded-lg p-3"
          >
            <option value="owner">Dog Owner</option>
            <option value="provider">Service Provider</option>
          </select>

          {/* Service Type (only for suppliers) */}
          {userType === "provider" && (
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full border rounded-lg p-3"
            >
              <option value="">Select service</option>
              <option value="walker">Dog Walker</option>
              <option value="groomer">Dog Groomer</option>
              <option value="trainer">Dog Trainer</option>
              <option value="boarding">Boarding</option>
              <option value="vet">Mobile Vet</option>
              <option value="transport">Pet Transport</option>
              <option value="other">Other</option>
            </select>
          )}

          {/* Suburb */}
          <Input
            placeholder="Enter your suburb"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
          />

          {/* Email */}
          <Input
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button className="w-full">
            Join the Waitlist
          </Button>

        </div>

      </div>
    </section>
  );
}