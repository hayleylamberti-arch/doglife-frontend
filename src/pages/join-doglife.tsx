import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * JoinDogLife is a simple page that asks the user
 * what kind of account they want to create (Owner or Supplier).
 * Based on the selection it navigates them to the proper sign‑up flow.
 */
export default function JoinDogLife() {
  const [role, setRole] = useState<"OWNER" | "SUPPLIER">("OWNER");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "SUPPLIER") {
      navigate("/supplier-onboarding");
    } else {
      navigate("/owner-signup");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join DogLife</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700">I am a:</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="OWNER"
                    checked={role === "OWNER"}
                    onChange={() => setRole("OWNER")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Pet Owner</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="SUPPLIER"
                    checked={role === "SUPPLIER"}
                    onChange={() => setRole("SUPPLIER")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Business / Supplier</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}