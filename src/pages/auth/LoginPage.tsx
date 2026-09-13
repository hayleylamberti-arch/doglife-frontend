import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { safeInternalReturnPath } from "@/lib/safeReturnPath";

type NavigationState = {
  returnTo?: unknown;
  from?: {
    pathname?: string;
  };
};

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
    const savedEmail = localStorage.getItem(
      "doglife_remembered_email"
    );

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const getDashboardPath = (user?: {
    role?: string | null;
    onboardingCompleted?: boolean;
  } | null) => {
    if (user?.role === "ADMIN") {
      return "/admin";
    }

    if (user?.role === "SUPPLIER") {
      return "/supplier/dashboard";
    }

    if (user?.role === "OWNER") {
      return user.onboardingCompleted
        ? "/owner/dashboard"
        : "/owner/onboarding";
    }

    return "/";
  };

  const navigationState =
    (location.state as NavigationState | null) || null;

  /*
   * Send a Slot continuation.
   *
   * This is deliberately separate from legacy state.from.
   * Only this value may be propagated into registration or
   * owner onboarding for the held-slot journey.
   */
  const explicitReturnTo = safeInternalReturnPath(
    navigationState?.returnTo
  );

  /*
   * Existing protected-route Login return behavior.
   *
   * Preserve the original HEAD semantics: state.from.pathname
   * is used after successful login for any completed OWNER,
   * SUPPLIER or ADMIN.
   */
  const legacyReturnTo = safeInternalReturnPath(
    navigationState?.from?.pathname
  );

  const getLoginErrorMessage = (loginError: any) => {
    const apiError =
      loginError?.response?.data?.error ||
      loginError?.response?.data?.message ||
      loginError?.message;

    console.error("DogLife login failed:", loginError);

    if (apiError === "Invalid email or password") {
      return "Incorrect email or password.";
    }

    if (apiError) {
      return apiError;
    }

    return "Unable to sign in. Please try again.";
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        email: normalizedEmail,
        password,
      });

      if (rememberMe) {
        localStorage.setItem(
          "doglife_remembered_email",
          normalizedEmail
        );
      } else {
        localStorage.removeItem(
          "doglife_remembered_email"
        );
      }

      const dashboardPath = getDashboardPath(
        result?.user
      );

      const incompleteOwner =
        result?.user?.role === "OWNER" &&
        !result?.user?.onboardingCompleted;

      /*
       * SEND A SLOT
       *
       * An incomplete OWNER must finish normal onboarding, with
       * the explicit hold return target preserved.
       *
       * An incomplete OWNER without an explicit hold target
       * retains the original Login behavior.
       */
      if (incompleteOwner) {
        if (explicitReturnTo) {
          navigate("/owner/onboarding", {
            replace: true,
            state: {
              returnTo: explicitReturnTo,
            },
          });
          return;
        }

        navigate(dashboardPath, {
          replace: true,
        });
        return;
      }

      /*
       * SEND A SLOT
       *
       * Only an OWNER may continue back into the held-slot
       * owner journey.
       *
       * SUPPLIER and ADMIN accounts deliberately ignore the
       * explicit hold return target and use their normal role
       * destination.
       */
      if (explicitReturnTo) {
        if (result?.user?.role === "OWNER") {
          navigate(explicitReturnTo, {
            replace: true,
          });
          return;
        }

        navigate(dashboardPath, {
          replace: true,
        });
        return;
      }

      /*
       * ORDINARY LOGIN
       *
       * Preserve the original protected-route state.from
       * behavior for completed OWNER, SUPPLIER and ADMIN.
       */
      if (
        legacyReturnTo &&
        legacyReturnTo !== "/" &&
        legacyReturnTo !== "/auth/login" &&
        legacyReturnTo !== "/auth" &&
        legacyReturnTo !== "/owner/onboarding"
      ) {
        navigate(legacyReturnTo, {
          replace: true,
        });
        return;
      }

      navigate(dashboardPath, {
        replace: true,
      });
    } catch (loginError: any) {
      setError(
        getLoginErrorMessage(loginError)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold">
        Login
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        Welcome back to DogLife.
      </p>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <input
          className="w-full rounded border px-3 py-2"
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="Email"
          required
          type="email"
          value={email}
        />

        <div className="relative">
          <input
            className="w-full rounded border px-3 py-2 pr-20"
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />

          <button
            className="absolute inset-y-0 right-3 text-sm font-medium text-orange-600"
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
            type="button"
          >
            {showPassword ? "Hide" : "View"}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            checked={rememberMe}
            className="h-4 w-4 rounded border-gray-300"
            onChange={(event) =>
              setRememberMe(event.target.checked)
            }
            type="checkbox"
          />
          Remember me
        </label>

        {error ? (
          <p className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <button
          className="w-full rounded bg-orange-500 px-4 py-2 font-medium text-white disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          className="text-orange-600"
          to="/auth/register"
          state={
            explicitReturnTo
              ? {
                  returnTo:
                    explicitReturnTo,
                }
              : undefined
          }
        >
          Join DogLife
        </Link>

        <Link
          className="text-orange-600"
          to="/auth/forgot-password"
        >
          Forgot password?
        </Link>
      </div>
    </section>
  );
}
