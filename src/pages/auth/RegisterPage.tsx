import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type RegisterRole = "OWNER" | "SUPPLIER";

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function PasswordCheckItem({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  return (
    <li className={valid ? "text-green-700" : "text-gray-500"}>
      {valid ? "✓" : "•"} {label}
    </li>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "OWNER" as RegisterRole,
    mobilePhone: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  );

  const passwordIsStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    form.password.length > 0 && form.password === form.confirmPassword;

  const formIsValid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.mobilePhone.trim().length > 0 &&
    passwordIsStrong &&
    passwordsMatch;

  const getPasswordErrorMessage = () => {
    if (!passwordChecks.minLength) {
      return "Password must be at least 8 characters.";
    }

    if (!passwordChecks.uppercase) {
      return "Password must include at least one uppercase letter.";
    }

    if (!passwordChecks.lowercase) {
      return "Password must include at least one lowercase letter.";
    }

    if (!passwordChecks.number) {
      return "Password must include at least one number.";
    }

    if (!passwordChecks.special) {
      return "Password must include at least one special character.";
    }

    if (!passwordsMatch) {
      return "Passwords do not match.";
    }

    return "Please complete all required fields.";
  };

  const getRegisterErrorMessage = (registerError: any) => {
    const responseData = registerError?.response?.data;

    if (Array.isArray(responseData?.details) && responseData.details.length > 0) {
      return responseData.details.join(" ");
    }

    return (
  registerError?.message ||
  responseData?.message ||
  responseData?.error ||
  "Unable to register. Please check your details and try again."
);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formIsValid) {
      setError(getPasswordErrorMessage());
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        mobilePhone: form.mobilePhone.trim(),
      });

      if (result.user.role === "SUPPLIER") {
        navigate("/supplier/dashboard", { replace: true });
      } else {
        navigate("/owner/dashboard", { replace: true });
      }
    } catch (registerError: any) {
      setError(getRegisterErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold">Join DogLife</h1>
      <p className="mb-6 text-sm text-gray-600">
        Create your account. Use a strong password to help keep your account safe.
      </p>

      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <input
          className="rounded border px-3 py-2"
          placeholder="First name"
          required
          value={form.firstName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, firstName: e.target.value }))
          }
        />

        <input
          className="rounded border px-3 py-2"
          placeholder="Last name"
          required
          value={form.lastName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, lastName: e.target.value }))
          }
        />

        <input
          className="rounded border px-3 py-2 md:col-span-2"
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>

          <div className="flex rounded border">
            <input
              className="min-w-0 flex-1 rounded-l px-3 py-2 outline-none"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="border-l px-3 text-sm font-medium text-gray-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <ul className="mt-2 space-y-1 text-xs">
            <PasswordCheckItem
              valid={passwordChecks.minLength}
              label="At least 8 characters"
            />
            <PasswordCheckItem
              valid={passwordChecks.uppercase}
              label="One uppercase letter"
            />
            <PasswordCheckItem
              valid={passwordChecks.lowercase}
              label="One lowercase letter"
            />
            <PasswordCheckItem
              valid={passwordChecks.number}
              label="One number"
            />
            <PasswordCheckItem
              valid={passwordChecks.special}
              label="One special character"
            />
          </ul>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Confirm password
          </label>

          <div className="flex rounded border">
            <input
              className="min-w-0 flex-1 rounded-l px-3 py-2 outline-none"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              required
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="border-l px-3 text-sm font-medium text-gray-600"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {form.confirmPassword.length > 0 ? (
            <p
              className={`mt-2 text-xs ${
                passwordsMatch ? "text-green-700" : "text-red-600"
              }`}
            >
              {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
            </p>
          ) : null}
        </div>

        <input
          className="rounded border px-3 py-2 md:col-span-2"
          placeholder="Mobile phone"
          required
          value={form.mobilePhone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, mobilePhone: e.target.value }))
          }
        />

        <select
          className="rounded border px-3 py-2 md:col-span-2"
          value={form.role}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              role: e.target.value as RegisterRole,
            }))
          }
        >
          <option value="OWNER">Owner</option>
          <option value="SUPPLIER">Supplier</option>
        </select>

        {error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <button
          className="rounded bg-orange-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          disabled={isSubmitting || !formIsValid}
          type="submit"
        >
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