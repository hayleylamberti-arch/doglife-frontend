// client/src/Routes.tsx (or doglife-frontend/src/Routes.tsx)
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Landing from "@/pages/landing";
import Profile from "@/pages/profile";
import Dashboard from "@/pages/dashboard";
import Suppliers from "@/pages/suppliers";
import Nearby from "@/pages/nearby";
import ProspectEnquiry from "@/pages/prospect-enquiry";
import OwnerSignup from "@/pages/owner-signup";
import RolloutLead from "@/pages/rollout-lead";
import MyDogsPage from "@/pages/my-dogs";
import AddDogPage from "@/pages/add-dog";
import SupplierProfileModern from "@/components/supplier-profile-modern";
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search";
import SupplierOnboarding from "@/pages/supplier-onboarding";
import ResetPassword from "@/pages/reset-password";

import { useAuth } from "@/hooks/use-auth";

// v6-style protected route using <Outlet />
function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // or a spinner component
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/prospect-enquiry" element={<ProspectEnquiry />} />
        <Route path="/owner-signup" element={<OwnerSignup />} />
        <Route path="/rollout-lead" element={<RolloutLead />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected */}
        <Route element={<ProtectedLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/my-dogs" element={<MyDogsPage />} />
          <Route path="/add-dog" element={<AddDogPage />} />
          <Route path="/supplier-onboarding" element={<SupplierOnboarding />} />
          <Route
            path="/supplier-profile-modern"
            element={<SupplierProfileModern supplierId="demo" />}
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </HashRouter>
  );
}