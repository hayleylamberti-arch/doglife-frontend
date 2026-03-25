import { Routes, Route } from "react-router-dom";

/* ================================
   LAYOUTS
================================ */
import OwnerLayout from "@layouts/OwnerLayout";
import SupplierLayout from "@layouts/SupplierLayout";

/* ================================
   PAGES (PUBLIC)
================================ */
import Landing from "@pages/landing";
import Search from "@pages/search";
import AuthPage from "@pages/auth-page";
import OwnerSignup from "@pages/owner-signup";

/* ================================
   OWNER PAGES
================================ */
import Dashboard from "@pages/dashboard";
import AddDog from "@pages/add-dog";
import MyDogs from "@pages/my-dogs";
import DogProfile from "@pages/dog-profile";
import Nearby from "@pages/nearby";
import Profile from "@pages/profile";

/* ================================
   SUPPLIER PAGES
================================ */
import SupplierDashboard from "@pages/supplier-dashboard";
import SupplierProfile from "@pages/supplier-profile";
import SupplierOnboarding from "@pages/supplier-onboarding";
import SupplierServicesPage from "@pages/supplier-services";

/* ================================
   BOOKING
================================ */
import BookService from "@pages/book-service";

/* ================================
   PROTECTED ROUTES
================================ */
import ProtectedRoute from "@components/ProtectedRoute";
import SupplierProtectedRoute from "@components/SupplierProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================================
          PUBLIC (NO NAVBAR)
      ================================= */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/owner-signup" element={<OwnerSignup />} />
      <Route path="/supplier-onboarding" element={<SupplierOnboarding />} />

      {/* ================================
          PUBLIC + OWNER (WITH NAVBAR)
      ================================= */}
      <Route element={<OwnerLayout />}>

        {/* PUBLIC WITH NAVBAR */}
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />

        {/* PROTECTED OWNER */}
        <Route
          element={
            <ProtectedRoute>
              <></>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-dog" element={<AddDog />} />
          <Route path="/my-dogs" element={<MyDogs />} />
          <Route path="/dog/:id" element={<DogProfile />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

      </Route>

      {/* ================================
          BOOKING (PUBLIC)
      ================================= */}
      <Route path="/book/:supplierId" element={<BookService />} />

      {/* ================================
          SUPPLIER (PROTECTED)
      ================================= */}
      <Route element={<SupplierProtectedRoute />}>
        <Route element={<SupplierLayout />}>
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/:id" element={<SupplierProfile />} />
          <Route path="/supplier-services" element={<SupplierServicesPage />} />
        </Route>
      </Route>

    </Routes>
  );
}