import { BrowserRouter, Routes, Route } from "react-router-dom";

import OwnerLayout from "@/layouts/OwnerLayout";
import SupplierLayout from "@/layouts/SupplierLayout";

import ProtectedRoute from "@/components/ProtectedRoute";
import SupplierProtectedRoute from "@/components/SupplierProtectedRoute";

import Dashboard from "@/pages/dashboard";
import Search from "@/pages/search";
import MyDogs from "@/pages/my-dogs";
import Profile from "@/pages/profile";

import SupplierDashboard from "@/pages/supplier-dashboard";
import SupplierOnboarding from "@/pages/supplier-onboarding";
import SupplierProfile from "@/pages/supplier-profile";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* OWNER AREA */}

        <Route
          element={
            <ProtectedRoute>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/my-dogs" element={<MyDogs />} />
          <Route path="/profile" element={<Profile />} />
        </Route>


        {/* SUPPLIER AREA */}

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


        {/* SUPPLIER ONBOARDING */}

        <Route
          path="/supplier-onboarding"
          element={
            <ProtectedRoute>
              <SupplierOnboarding />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}