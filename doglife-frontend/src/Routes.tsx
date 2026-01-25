// client/src/Routes.tsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search";
import { useAuth } from "@/hooks/use-auth";

// v6-style protected route using <Outlet />
function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;          // or a spinner component
  if (!isAuthenticated) return <Navigate to="/" replace />; // bounce to Landing

  return <Outlet />; // render child route
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/prospect-enquiry" element={<ProspectEnquiry />} />
        <Route path="/owner-signup" element={<OwnerSignup />} />
        <Route path="/rollout-lead" element={<RolloutLead />} />

        {/* Protected section */}
        <Route element={<ProtectedLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/my-dogs" element={<MyDogsPage />} />
          <Route path="/add-dog" element={<AddDogPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}