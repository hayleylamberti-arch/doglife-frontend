import { Route } from "react-router-dom";

import SupplierLayout from "@/layouts/SupplierLayout";
import SupplierProtectedRoute from "@/components/SupplierProtectedRoute";

import SupplierDashboard from "@/pages/supplier-dashboard";
import SupplierProfile from "@/pages/supplier-profile";
import SupplierServices from "@/pages/supplier-services";
import SupplierAvailability from "@/pages/supplier-availability";
import SupplierOnboarding from "@/pages/supplier-onboarding";

export default function SupplierRoutes() {
  return (
    <>
      {/* Protected Supplier Area */}
      <Route path="/supplier" element={<SupplierProtectedRoute />}>
        <Route element={<SupplierLayout />}>

          <Route path="dashboard" element={<SupplierDashboard />} />
          <Route path="profile" element={<SupplierProfile />} />
          <Route path="services" element={<SupplierServices />} />
          <Route path="availability" element={<SupplierAvailability />} />

        </Route>
      </Route>

      {/* Public */}
      <Route path="/supplier-onboarding" element={<SupplierOnboarding />} />
    </>
  );
}