import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

      // ✅ If user was redirected here from another page
      if (from && from !== "/") {
        navigate(from, { replace: true });
        return;
      }

      // ✅ ROLE-BASED REDIRECT (FINAL FIX)
if (result.user.role === "SUPPLIER") {
  navigate("/supplier/dashboard", { replace: true });
} else {
  navigate("/owner/dashboard", { replace: true });
}

    } catch (loginError: any) {
      setError(loginError?.response?.data?.message ?? "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold">Login</h1>
      <p className="mb-6 text-sm text-gray-600">Welcome back to DogLife.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded border px-3 py-2"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />
        <input
          className="w-full rounded border px-3 py-2"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full rounded bg-orange-500 px-4 py-2 font-medium text-white"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="text-orange-600" to="/auth/register">
          Join DogLife
        </Link>
        <Link className="text-orange-600" to="/auth/forgot-password">
          Forgot password?
        </Link>
      </div>
    </section>
  );
}