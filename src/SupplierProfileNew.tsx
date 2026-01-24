import React, { useState, useEffect } from "react";

/** Mirror of your Prisma enums, but safe for the browser bundle */
const SERVICE_TYPES = [
  "BOARDING",
  "GROOMING",
  "DAYCARE",
  "WALKING",
  "TRAINING",
  "PET_SITTING",
  "PET_TRANSPORT",
  "MOBILE_VET",
] as const;

const SUPPLIER_UNITS = [
  "PER_WALK",
  "PER_SESSION",
  "PER_DAY",
  "PER_NIGHT",
  "PER_VISIT",
  "PER_TRIP",
] as const;

type ServiceType = (typeof SERVICE_TYPES)[number];
type SupplierUnit = (typeof SUPPLIER_UNITS)[number];

type ServiceRow = {
  service: ServiceType;
  unit: SupplierUnit;
  /** UI collects rands; server will convert to cents */
  baseRateRands: string;
  durationMinutes?: string; // optional
};

type SuburbOption = { id: string; name: string; city?: string; province?: string };

const [suburbs, setSuburbs] = useState<SuburbOption[]>([]);
const [suburbLoading, setSuburbLoading] = useState(false);
const [suburbError, setSuburbError] = useState<string | null>(null);

interface FormData {
  // Account (you may already collect email/password elsewhere; keep if needed)
  email: string;
  password: string;

  // Profile basics
  businessName: string;
  contactName: string;
  phone: string;

  // Location
  suburbId: string;              // base suburb (single)
  operatingSuburbIds: string[];  // coverage suburbs (multi)

  // Services & pricing
  services: ServiceRow[];

  // Legal/opt-ins
  consent: boolean;
  marketingOptIn?: boolean;
}

const SupplierProfileNew: React.FC = () => {
  const [data, setData] = useState<FormData>({
    email: "",
    password: "",
    businessName: "",
    contactName: "",
    phone: "",
    suburbId: "",
    operatingSuburbIds: [],
    services: [
      { service: "WALKING", unit: "PER_WALK", baseRateRands: "" },
    ],
    consent: false,
    marketingOptIn: false,
  });

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const updateService = (i: number, patch: Partial<ServiceRow>) =>
    setData((d) => {
      const next = [...d.services];
      next[i] = { ...next[i], ...patch };
      return { ...d, services: next };
    });

  const addService = () =>
    setData((d) => ({
      ...d,
      services: [...d.services, { service: "WALKING", unit: "PER_WALK", baseRateRands: "" }],
    }));

  const removeService = (i: number) =>
    setData((d) => ({ ...d, services: d.services.filter((_, idx) => idx !== i) }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setSuburbLoading(true);
        setSuburbError(null);

        const res = await fetch("/api/suburbs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Normalize and sort
        const list: SuburbOption[] = (json.suburbs ?? []).map((s: any) => ({
          id: s.id,
          name: s.suburbName ?? s.name ?? "",
          city: s.city ?? "Other",
          province: s.province ?? "",
        }));

        // ✅ Alphabetize by city, then by suburb name
        list.sort((a, b) => {
          const cityCompare = a.city.localeCompare(b.city);
          return cityCompare !== 0
            ? cityCompare
            : a.name.localeCompare(b.name);
        });

        if (!cancelled) setSuburbs(list);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setSuburbError("Could not load suburbs");
      } finally {
        if (!cancelled) setSuburbLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);


  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // Basic client-side guards; server will do full Zod + Prisma-enum validation
    if (!data.consent) {
      alert("Please accept the terms & privacy policy.");
      return;
    }
    if (!data.suburbId) {
      alert("Please select your base suburb.");
      return;
    }
    if (!data.operatingSuburbIds.length) {
      alert("Please select at least one operating suburb.");
      return;
    }
    if (!data.services.length) {
      alert("Please add at least one service.");
      return;
    }

    // Normalize payload for API
    const payload = {
      email: data.email.trim().toLowerCase(),
      password: data.password, // server hashes
      businessName: data.businessName.trim(),
      contactName: data.contactName.trim(),
      phone: data.phone.trim(),
      baseSuburbId: data.suburbId,                 // <-- matches SupplierProfile.suburbId
      operatingSuburbIds: Array.from(new Set(data.operatingSuburbIds)),
      services: data.services.map((s) => ({
        service: s.service,                        // enum token
        unit: s.unit,                              // enum token
        baseRateRands: Number(s.baseRateRands || 0),
        durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : null,
      })),
      marketingOptIn: !!data.marketingOptIn,
      consent: true,
    };

    const res = await fetch("/api/suppliers/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Signup error:", err);
      setSuburbError(err?.error ?? "Could not complete supplier sign up.");
      return;
    }

    alert("Supplier profile created! 🐶");

    // ✅ Reset the form fields
    setData({
      email: "",
      password: "",
      businessName: "",
      contactName: "",
      phone: "",
      suburbId: "",
      operatingSuburbIds: [],
      services: [{ service: "WALKING", unit: "PER_WALK", baseRateRands: "" }],
      consent: false,
      marketingOptIn: false,
    });
// route to dashboard/search/etc...
  };

  // NOTE: replace the simple inputs below with your styled components/autocomplete.
  // The important part is that you submit IDs for suburbs and the enum tokens for services/units.
  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <h2>Supplier sign up</h2>

      {/* ✅ Show error message if signup fails */}
      {!!suburbError && (
        <div style={{ color: "red", marginBottom: "12px" }}>
          {suburbError}
        </div>
      )}

      <fieldset>
        <legend>Account</legend>
        <label>Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={data.password}
          onChange={(e) => update("password", e.target.value)}
          required
          minLength={8}
        />
      </fieldset>

      <fieldset>
        <legend>Business details</legend>
        <label>Business name
          <input
            value={data.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            required
          />
        </label>
        <label>Contact name
          <input
            value={data.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            required
          />
        </label>
        <label>Mobile / WhatsApp
          <input
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Services & pricing</legend>

        {data.services.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8 }}>
            <select
              value={s.service}
              onChange={(e) => updateService(i, { service: e.target.value as ServiceType })}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t.replaceAll("_", " ")}</option>
              ))}
            </select>

            <select
              value={s.unit}
              onChange={(e) => updateService(i, { unit: e.target.value as SupplierUnit })}
            >
              {SUPPLIER_UNITS.map((u) => (
                <option key={u} value={u}>{u.replaceAll("_", " ")}</option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Rate (R)"
              value={s.baseRateRands}
              onChange={(e) => updateService(i, { baseRateRands: e.target.value })}
            />

            <input
              type="number"
              min="0"
              placeholder="Duration (mins)"
              value={s.durationMinutes ?? ""}
              onChange={(e) => updateService(i, { durationMinutes: e.target.value })}
            />

            <button type="button" onClick={() => removeService(i)}>Remove</button>
          </div>
        ))}

        <button type="button" onClick={addService}>+ Add service</button>
      </fieldset>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={!!data.marketingOptIn}
          onChange={(e) => update("marketingOptIn", e.target.checked)}
        />
        Receive DogLife tips & updates
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={data.consent}
          onChange={(e) => update("consent", e.target.checked)}
          required
        />
        I agree to the Terms and Privacy Policy
      </label>

      <button type="submit">Create supplier profile</button>
    </form>
  );
};

export default SupplierProfileNew;
