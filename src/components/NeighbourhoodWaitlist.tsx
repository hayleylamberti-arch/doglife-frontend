import { useState } from "react"
import { Button } from "@/components/ui/button"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function NeighbourhoodWaitlist() {
  const [email, setEmail] = useState("")
  const [suburb, setSuburb] = useState("")
  const [province, setProvince] = useState("")
  const [userType, setUserType] = useState("OWNER")
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [businessStatus, setBusinessStatus] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const provinceSuburbs: Record<string, string[]> = {
    Gauteng: ["Sandton", "Fourways", "Midrand", "Rosebank", "Randburg", "Centurion", "Pretoria"],
    "Western Cape": ["Cape Town", "Claremont", "Sea Point", "Stellenbosch", "Bellville"],
    "KwaZulu-Natal": ["Durban", "Umhlanga", "Ballito", "Pinetown"],
    "Eastern Cape": ["Port Elizabeth", "East London"],
    "Free State": ["Bloemfontein"],
    Limpopo: ["Polokwane"],
    Mpumalanga: ["Nelspruit"],
    "North West": ["Rustenburg"],
    "Northern Cape": ["Kimberley"],
  }

  const services = [
    { label: "Dog Walking", value: "WALKING" },
    { label: "Dog Grooming", value: "GROOMING" },
    { label: "Dog Training", value: "TRAINING" },
    { label: "Boarding", value: "BOARDING" },
    { label: "Mobile Vet", value: "MOBILE_VET" },
    { label: "Pet Transport", value: "PET_TRANSPORT" },
  ]

  const businessOptions = ["Yes — established business", "No — starting soon"]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          suburb,
          province,
          userType,
          serviceTypes,
          businessStatus,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setEmail("")
        setSuburb("")
        setProvince("")
        setServiceTypes([])
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
          Don’t see your suburb yet?
        </h2>

        <p className="text-gray-600 mb-8">
          DogLife is launching suburb by suburb across South Africa. Join the waitlist and we’ll let you know when trusted dog services are available near you.
        </p>

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            ✅ You’re on the list. We’ll keep you updated.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="OWNER">I’m a dog owner</option>
              <option value="SUPPLIER">I provide dog services</option>
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
                ))}
            </select>

            <input
              type="email"
              placeholder="Email address"
              className="w-full p-3 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {userType === "SUPPLIER" && (
              <>
                <div className="text-left">
                  <p className="text-sm font-medium mb-2">
                    What services do you offer?
                  </p>

                  <div className="space-y-2">
                    {services.map((s) => (
                      <label key={s.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={serviceTypes.includes(s.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServiceTypes([...serviceTypes, s.value])
                            } else {
                              setServiceTypes(serviceTypes.filter((v) => v !== s.value))
                            }
                          }}
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                <select
                  value={businessStatus}
                  onChange={(e) => setBusinessStatus(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Are you already offering these services?</option>
                  {businessOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-[hsl(24,100%,50%)] text-white"
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