import { useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function NeighbourhoodWaitlist() {
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [province, setProvince] = useState("");
  const [userType, setUserType] = useState("OWNER");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [businessStatus, setBusinessStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const provinceSuburbs: Record<string, string[]> = {
    Gauteng: [
      "Fourways",
      "Lonehill",
      "Paulshof",
      "Sunninghill",
      "Kyalami",
      "Bryanston",
      "Rivonia",
      "Douglasdale",
      "Broadacres",
      "Craigavon",
      "Woodmead",
      "Midrand",
      "Noordwyk",
      "Randjesfontein",
      "Waterfall",
      "Sandton",
      "Randburg",
      "Centurion",
      "Pretoria East",
    ],
    "Western Cape": [
      "Cape Town",
      "Claremont",
      "Sea Point",
      "Stellenbosch",
      "Bellville",
    ],
    "KwaZulu-Natal": ["Durban", "Umhlanga", "Ballito", "Pinetown"],
    "Eastern Cape": ["Port Elizabeth", "East London"],
    "Free State": ["Bloemfontein"],
    Limpopo: ["Polokwane"],
    Mpumalanga: ["Nelspruit"],
    "North West": ["Rustenburg"],
    "Northern Cape": ["Kimberley"],
  };

  const services = [
    { label: "Dog Walking", value: "WALKING" },
    { label: "Dog Grooming", value: "GROOMING" },
    { label: "Dog Training", value: "TRAINING" },
    { label: "Boarding", value: "BOARDING" },
    { label: "Mobile Vet", value: "MOBILE_VET" },
    { label: "Pet Transport", value: "PET_TRANSPORT" },
  ];

  const businessOptions = ["Yes — established business", "No — starting soon"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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
      });

      if (res.ok) {
        setSuccess(true);
        setEmail("");
        setSuburb("");
        setProvince("");
        setServiceTypes([]);
        setBusinessStatus("");
      }
    } catch (error) {
      console.error("Waitlist signup failed:", error);
    }

    setLoading(false);
  }

  return (
    <section className="bg-blue-50 py-16">
      <div className="mx-auto max-w-xl px-6 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">
          Don’t see your suburb yet?
        </h2>

        <p className="mb-8 text-gray-600">
          DogLife is launching suburb by suburb across South Africa. Join the
          waitlist and we’ll let you know when trusted dog services are
          available near you.
        </p>

        {success ? (
          <div className="rounded-lg bg-green-100 p-4 text-green-800">
            ✅ You’re on the list. We’ll keep you updated.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="OWNER">I’m a dog owner</option>
              <option value="SUPPLIER">I provide dog services</option>
            </select>

            <select
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setSuburb("");
              }}
              className="w-full rounded-lg border p-3"
              required
            >
              <option value="">Select province</option>
              {Object.keys(provinceSuburbs).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="w-full rounded-lg border p-3"
              required
              disabled={!province}
            >
              <option value="">
                {province ? "Select suburb" : "Select province first"}
              </option>

              {province &&
                provinceSuburbs[province].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>

            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-lg border p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {userType === "SUPPLIER" && (
              <>
                <div className="text-left">
                  <p className="mb-2 text-sm font-medium">
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
                              setServiceTypes([...serviceTypes, s.value]);
                            } else {
                              setServiceTypes(
                                serviceTypes.filter((v) => v !== s.value)
                              );
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
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">
                    Are you already offering these services?
                  </option>
                  {businessOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
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
  );
}