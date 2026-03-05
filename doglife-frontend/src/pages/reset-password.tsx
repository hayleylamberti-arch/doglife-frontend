import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* 🔐 Password Strength Helper                                                */
/* -------------------------------------------------------------------------- */

function getPasswordStrength(password: string) {
  if (password.length < 8) return { label: "Weak", color: "#ef4444" };

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  if (score === 0) return { label: "Weak", color: "#ef4444" };
  if (score === 1) return { label: "Medium", color: "#f59e0b" };
  return { label: "Strong", color: "#10b981" };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* -------------------------------------------------------------------------- */
  /* 🔎 Calculate password strength                                             */
  /* -------------------------------------------------------------------------- */

  const strength = getPasswordStrength(password);

  /* -------------------------------------------------------------------------- */
  /* 🔁 Submit Handler                                                          */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage("Invalid reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await res.json();

      if (data.ok) {
        setMessage("Password updated successfully! Redirecting to sign in...");

        setTimeout(() => {
          navigate("/auth-page");
        }, 2000);
      } else {
        setMessage(data.error || "Password reset failed.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🎨 UI                                                                      */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 10,
          padding: 30,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: 10 }}>Create a New Password</h2>

        <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          Enter a new password for your DogLife account.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password Field */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: 14,
                color: "#666",
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          {/* Password Strength */}
          <p
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: strength.color,
              fontWeight: 500,
            }}
          >
            Password strength: {strength.label}
          </p>

          {/* Confirm Password */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: 14,
                color: "#666",
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: 16, fontSize: 14, color: "#444" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}