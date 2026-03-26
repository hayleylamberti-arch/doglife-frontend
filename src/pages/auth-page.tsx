import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * AuthPage renders the login form and handles user authentication.  It
 * initiates a POST to `/api/auth/login` via react-query.  On success
 * it stores the returned token in context and redirects the user to
 * the correct dashboard based on their role (owner or supplier).  If
 * the user is already authenticated, it immediately redirects to the
 * owner dashboard.  Links are provided for users who don't yet have
 * accounts to register either as an owner or as a supplier.
 */
export default function AuthPage() {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect authenticated users away from the login page
  useEffect(() => {
    if (token) {
      // default redirect for existing sessions
      navigate("/dashboard");
    }
  }, [token, navigate]);

  /* ================================
     LOGIN MUTATION
  ================================ */
  const loginMutation = useMutation({
    // attempt to log the user in by posting credentials to the API
    mutationFn: async () => {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });
      return res.data;
    },

    // save token and redirect based on role when login succeeds
    onSuccess: (data) => {
      setToken(data.token);

      // ✅ ROLE-BASED REDIRECT
      if (data.role === "SUPPLIER") {
        navigate("/supplier-dashboard");
      } else {
        // treat all other roles as owners
        navigate("/dashboard");
      }
    },

    // surface an error message to the user on failure
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Login failed");
    },
  });

  /* ================================
     SUBMIT HANDLER
  ================================ */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  /* ================================
     UI
  ================================ */
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Registration links for new users */}
          <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
            New to DogLife?{" "}
            <Link
              to="/owner-signup"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Join as an Owner
            </Link>{" "}
            or{" "}
            <Link
              to="/supplier-onboarding"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Register your business
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}