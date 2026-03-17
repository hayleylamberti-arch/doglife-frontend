import { Routes, Route } from "react-router-dom";

import OwnerLayout from "@/layouts/OwnerLayout";

import Landing from "@/pages/landing";
import Search from "@/pages/search";
import AuthPage from "@/pages/auth-page";

import AddDog from "@/pages/add-dog";
import Dashboard from "@/pages/dashboard";
import MyDogs from "@/pages/my-dogs";
import Nearby from "@/pages/nearby";
import Profile from "@/pages/profile";
import DogProfile from "@/pages/dog-profile";
import OwnerSignup from "@/pages/owner-signup";

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