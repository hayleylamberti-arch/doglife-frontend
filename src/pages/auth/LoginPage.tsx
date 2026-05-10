import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("doglife_remembered_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const getDashboardPath = (role?: string | null) => {
  if (role === "ADMIN") return "/admin";
  if (role === "SUPPLIER") return "/supplier/dashboard";
  if (role === "OWNER") return "/owner/dashboard";
  return "/";
};

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });

      if (rememberMe) {
        localStorage.setItem("doglife_remembered_email", email);
      } else {
        localStorage.removeItem("doglife_remembered_email");
      }

      const role = result?.user?.role;
      const dashboardPath = getDashboardPath(role);

      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;

      if (from && from !== "/" && from !== "/auth/login" && from !== "/auth") {
        navigate(from, { replace: true });
        return;
      }

      navigate(dashboardPath, { replace: true });
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

        <div className="relative">
          <input
            className="w-full rounded border px-3 py-2 pr-20"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />

          <button
            className="absolute inset-y-0 right-3 text-sm font-medium text-orange-600"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? "Hide" : "View"}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            checked={rememberMe}
            className="h-4 w-4 rounded border-gray-300"
            onChange={(event) => setRememberMe(event.target.checked)}
            type="checkbox"
          />
          Remember me
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          className="w-full rounded bg-orange-500 px-4 py-2 font-medium text-white disabled:opacity-50"
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