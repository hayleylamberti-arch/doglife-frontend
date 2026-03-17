import { Routes, Route } from "react-router-dom";

import OwnerLayout from "@layouts/OwnerLayout";

import Landing from "@pages/landing";
import Search from "@pages/search";
import AuthPage from "@pages/auth-page";
import OwnerSignup from "@pages/owner-signup";

import Dashboard from "@pages/dashboard";
import AddDog from "@pages/add-dog";
import MyDogs from "@pages/my-dogs";
import DogProfile from "@pages/dog-profile";
import Nearby from "@pages/nearby";
import Profile from "@pages/profile";

import SupplierOnboarding from "@pages/supplier-onboarding";
import SupplierDashboard from "@pages/supplier-dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<OwnerLayout />}>
        
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Search */}
        <Route path="/search" element={<Search />} />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Owner onboarding */}
        <Route path="/owner-signup" element={<OwnerSignup />} />

        {/* ✅ ADD THIS HERE */}
        <Route path="/supplier-onboarding" element={<SupplierOnboarding />} />
        <Route path="/supplier-dashboard" element={<SupplierDashboard />} />

        {/* Owner dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Dogs */}
        <Route path="/add-dog" element={<AddDog />} />
        <Route path="/my-dogs" element={<MyDogs />} />
        <Route path="/dog/:id" element={<DogProfile />} />

        {/* Discovery */}
        <Route path="/nearby" element={<Nearby />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

      </Route>
    </Routes>
  );
}