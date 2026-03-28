import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "OWNER" as "OWNER" | "SUPPLIER",
    mobilePhone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await register(form);

      if (result.user.role === "SUPPLIER") {
        navigate("/supplier/dashboard", { replace: true });
      } else {
        navigate("/owner/dashboard", { replace: true });
      }
    } catch (registerError: any) {
      setError(registerError?.response?.data?.message ?? "Unable to register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold">Join DogLife</h1>
      <p className="mb-6 text-sm text-gray-600">Create your account.</p>

      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="rounded border px-3 py-2" placeholder="First name" required value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
        <input className="rounded border px-3 py-2" placeholder="Last name" required value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
        <input className="rounded border px-3 py-2 md:col-span-2" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
        <input className="rounded border px-3 py-2 md:col-span-2" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Mobile phone" required value={form.mobilePhone} onChange={(e) => setForm((prev) => ({ ...prev, mobilePhone: e.target.value }))} />
        <select className="rounded border px-3 py-2 md:col-span-2" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as "OWNER" | "SUPPLIER" }))}>
          <option value="OWNER">Owner</option>
          <option value="SUPPLIER">Supplier</option>
        </select>

        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

        <button className="rounded bg-orange-500 px-4 py-2 font-medium text-white md:col-span-2" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link className="text-orange-600" to="/auth/login">
          Login
        </Link>
      </p>
    </section>
  );
}
