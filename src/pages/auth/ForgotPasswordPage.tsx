import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("If that email exists, a reset link has been sent.");
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? "Unable to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold">Forgot password</h1>
      <p className="mb-6 text-sm text-gray-600">We'll email you a password reset link.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="w-full rounded bg-orange-500 px-4 py-2 font-medium text-white" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </section>
  );
}
