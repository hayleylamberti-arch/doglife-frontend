import { useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setMessage("Missing or invalid reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.post(
        "/auth/reset-password",
        { token, newPassword },
        { headers: { Authorization: undefined } },
      );
      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message ?? "Unable to reset password.");
      } else {
        setMessage("Unable to reset password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold">Reset password</h1>
      <p className="mb-6 text-sm text-gray-600">Set a new password for your account.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="New password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Confirm new password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button className="w-full rounded bg-orange-500 px-4 py-2 font-medium text-white" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

      <p className="mt-4 text-sm">
        Back to <Link className="text-orange-600" to="/auth/login">Login</Link>
      </p>
    </section>
  );
}
