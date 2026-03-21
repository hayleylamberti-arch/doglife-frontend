import { Routes, Route } from "react-router-dom";

/* ===============================
   OWNER LAYOUT + PAGES
=============================== */
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

/* ===============================
   SUPPLIER
=============================== */
import SupplierLayout from "@layouts/SupplierLayout";
import SupplierProtectedRoute from "@components/SupplierProtectedRoute";

import SupplierDashboard from "@pages/supplier-dashboard";
import SupplierProfile from "@pages/supplier-profile";
import SupplierOnboarding from "@pages/supplier-onboarding";

/* ===============================
   BOOKING (NEW)
=============================== */
import BookService from "@pages/book-service";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ===============================
          SUPPLIER ROUTES (PROTECTED)
      =============================== */}
      <Route element={<SupplierProtectedRoute />}>
        <Route element={<SupplierLayout />}>
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/:id" element={<SupplierProfile />} />
        </Route>
      </Route>

      {/* Public supplier onboarding */}
      <Route path="/supplier-onboarding" element={<SupplierOnboarding />} />

      {/* ===============================
          BOOKING ROUTE (GLOBAL)
      =============================== */}
      <Route path="/book/:supplierId" element={<BookService />} />

      {/* ===============================
          OWNER ROUTES
      =============================== */}
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