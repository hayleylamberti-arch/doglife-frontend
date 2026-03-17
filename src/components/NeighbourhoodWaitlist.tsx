import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function NeighbourhoodWaitlist() {

  const [email, setEmail] = useState("")
  const [suburb, setSuburb] = useState("")
  const [province, setProvince] = useState("")
  const [userType, setUserType] = useState("owner")
  const [serviceType, setServiceType] = useState("")
  const [businessStatus, setBusinessStatus] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const provinceSuburbs: Record<string, string[]> = {
  "Gauteng": [
    "Sandton",
    "Fourways",
    "Midrand",
    "Rosebank",
    "Randburg",
    "Centurion",
    "Pretoria"
  ],

  "Western Cape": [
    "Cape Town",
    "Claremont",
    "Sea Point",
    "Stellenbosch",
    "Bellville"
  ],

  "KwaZulu-Natal": [
    "Durban",
    "Umhlanga",
    "Ballito",
    "Pinetown"
  ],

  "Eastern Cape": [
    "Port Elizabeth",
    "East London"
  ],

  "Free State": [
    "Bloemfontein"
  ],

  "Limpopo": [
    "Polokwane"
  ],

  "Mpumalanga": [
    "Nelspruit"
  ],

  "North West": [
    "Rustenburg"
  ],

  "Northern Cape": [
    "Kimberley"
  ]
}

  const services = [
    "Dog Walking",
    "Dog Grooming",
    "Dog Training",
    "Boarding",
    "Mobile Vet",
    "Pet Transport"
  ]

  const businessOptions = [
    "Yes — established business",
    "No — starting soon"
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("https://doglife-backend.onrender.com/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          suburb,
          province,
          userType,
          serviceType,
          businessStatus
        })
      })

      if (res.ok) {
        setSuccess(true)
        setEmail("")
        setSuburb("")
        setProvince("")
        setServiceType("")
        setBusinessStatus("")
      }

    } catch (error) {
      console.error("Waitlist signup failed:", error)
    }

    setLoading(false)
  }

  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-xl mx-auto px-6 text-center">

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Want DogLife in your neighbourhood?
        </h2>

        <p className="text-gray-600 mb-8">
          We're launching in Gauteng first. Join the waitlist and we'll notify you when DogLife launches in your suburb.
        </p>

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            ✅ You're on the list! We'll notify you when DogLife launches near you.
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="space-y-4">

          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="owner">Dog Owner</option>
            <option value="provider">Service Provider</option>
          </select>

          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value)
              setSuburb("")
            }}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="">Select province</option>
            {Object.keys(provinceSuburbs).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
            disabled={!province}
          >
            <option value="">
              {province ? "Select suburb" : "Select province first"}
            </option>

            {province &&
              provinceSuburbs[province].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))
            }

          </select>

          <input
            type="email"
            placeholder="Email address"
            className="w-full p-3 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {userType === "provider" && (
            <>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">Service offered</option>
                {services.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>

              <select
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Are you an existing business?</option>
                {businessOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-[hsl(24,100%,50%)] hover:bg-[hsl(24,100%,45%)] text-white"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join the Waitlist"}
          </Button>

        </form>
        )}

      </div>
    </section>
  )
}