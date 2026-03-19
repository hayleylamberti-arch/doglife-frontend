import { Routes, Route } from "react-router-dom";

import OwnerLayout from "@layouts/OwnerLayout";
import SupplierRoutes from "./SupplierRoutes";

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

export default function AppRoutes() {
  return (
    <Routes>

      {/* ✅ Supplier routes (separate system) */}
      <SupplierRoutes />

      {/* Owner routes */}
      <Route element={<OwnerLayout />}>
        
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/owner-signup" element={<OwnerSignup />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/add-dog" element={<AddDog />} />
        <Route path="/my-dogs" element={<MyDogs />} />
        <Route path="/dog/:id" element={<DogProfile />} />

        <Route path="/nearby" element={<Nearby />} />
        <Route path="/profile" element={<Profile />} />

      </Route>
    </Routes>
  );
}