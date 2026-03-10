"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NeighbourhoodWaitlist() {

  const [email, setEmail] = useState("")
  const [suburb, setSuburb] = useState("")
  const [province, setProvince] = useState("")
  const [userType, setUserType] = useState("owner")
  const [serviceType, setServiceType] = useState("")
  const [businessStatus, setBusinessStatus] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

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

          <Input
            placeholder="Suburb (e.g. Sandton)"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
          />

          <Input
            placeholder="Province (e.g. Gauteng)"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />

          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {userType === "provider" && (
            <>
              <Input
                placeholder="Service offered (e.g. Dog Walking)"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />

              <Input
                placeholder="Are you an existing business? (optional)"
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value)}
              />
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