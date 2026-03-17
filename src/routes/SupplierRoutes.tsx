import { Route } from "react-router-dom";

import SupplierLayout from "@/layouts/SupplierLayout";
import SupplierProtectedRoute from "@/components/SupplierProtectedRoute";

import SupplierDashboard from "@/pages/supplier-dashboard";
import SupplierProfile from "@/pages/supplier-profile";
import SupplierOnboarding from "@/pages/supplier-onboarding";

export default function SupplierRoutes() {
  return (
    <>
      <Route
        element={
          <SupplierProtectedRoute>
            <SupplierLayout />
          </SupplierProtectedRoute>
        }
      >
        <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
        <Route path="/supplier-profile" element={<SupplierProfile />} />
      </Route>

      <Route
        path="/supplier-onboarding"
        element={<SupplierOnboarding />}
      />
    </>
  );
}