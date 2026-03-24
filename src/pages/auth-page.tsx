import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ================================
     LOGIN MUTATION
  ================================ */

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setToken(data.token); // 🔥 CRITICAL
      navigate("/dashboard"); // default for now
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Login failed");
    },
  });

  /* ================================
     SUBMIT
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
        </CardContent>
      </Card>
    </div>
  );
}