import { Route } from "react-router-dom";

import OwnerLayout from "@/layouts/OwnerLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Dashboard from "@/pages/dashboard";
import MyDogs from "@/pages/my-dogs";
import Profile from "@/pages/profile";

export default function OwnerRoutes() {
  return (
    <>
      <Route
        element={
          <ProtectedRoute>
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/owner-dashboard" element={<Dashboard />} />
        <Route path="/my-dogs" element={<MyDogs />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </>
  );
}