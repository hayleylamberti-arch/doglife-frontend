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
import DogProfilePage from "@/pages/dog-profile";
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search";
import SupplierOnboarding from "@/pages/supplier-onboarding";
import ResetPassword from "@/pages/reset-password";
import SupplierProfilePage from "@/pages/supplier-profile";
import SupplierDashboard from "@/pages/supplier-dashboard";

import SupplierProfileModern from "@/components/supplier-profile-modern";
import AppLayout from "@/components/AppLayout";
import SupplierLayout from "@/components/SupplierLayout";
import SupplierBookings from "@/pages/supplier-bookings";

import { useAuth } from "@/hooks/use-auth";

/* ===============================
   Protected Layout (login required)
================================ */

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ===============================
   Supplier Role Guard
================================ */

function SupplierProtected() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || user.role !== "SUPPLIER") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ===============================
   Supplier Onboarding Guard
================================ */

function SupplierOnboardingGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!user.onboardingCompleted) {
    return <Navigate to="/supplier-onboarding" replace />;
  }

  return <Outlet />;
}

/* ===============================
   Routes
================================ */

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>

        {/* Auth page WITHOUT layout */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Main layout */}
        <Route element={<AppLayout />}>

          {/* Public pages */}

          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/supplier/:id" element={<SupplierProfilePage />} />
          <Route path="/prospect-enquiry" element={<ProspectEnquiry />} />
          <Route path="/owner-signup" element={<OwnerSignup />} />
          <Route path="/rollout-lead" element={<RolloutLead />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected pages */}

          <Route element={<ProtectedLayout />}>

            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nearby" element={<Nearby />} />
            <Route path="/my-dogs" element={<MyDogsPage />} />
            <Route path="/add-dog" element={<AddDogPage />} />
            <Route path="/dogs/:id" element={<DogProfilePage />} />

            {/* Supplier Routes */}

            <Route element={<SupplierProtected />}>

              {/* Onboarding always allowed */}
              <Route
                path="/supplier-onboarding"
                element={<SupplierOnboarding />}
              />

              <Route
  path="/supplier-bookings"
  element={<SupplierBookings />}
/>

              {/* Everything else requires onboarding */}
              <Route element={<SupplierOnboardingGuard />}>

                <Route element={<SupplierLayout />}>

                  <Route
                    path="/supplier-dashboard"
                    element={<SupplierDashboard />}
                  />

                  <Route
                    path="/supplier-profile"
                    element={<SupplierProfilePage />}
                  />

                </Route>

              </Route>

            </Route>

          </Route>

        </Route>

        {/* Optional demo route */}

        <Route
          path="/supplier-profile-modern"
          element={<SupplierProfileModern supplierId="demo" />}
        />

        {/* 404 */}

        <Route path="*" element={<div>404</div>} />

      </Routes>
    </HashRouter>
  );
}