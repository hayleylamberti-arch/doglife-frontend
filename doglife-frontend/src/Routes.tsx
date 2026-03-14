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

        <Route element={<OwnerLayout />}>

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-dogs"
            element={
              <ProtectedRoute>
                <MyDogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* SUPPLIER AREA */}

        <Route element={<SupplierLayout />}>

          <Route
            path="/supplier-dashboard"
            element={
              <SupplierProtectedRoute>
                <SupplierDashboard />
              </SupplierProtectedRoute>
            }
          />

          <Route
            path="/supplier-profile"
            element={
              <SupplierProtectedRoute>
                <SupplierProfile />
              </SupplierProtectedRoute>
            }
          />

          <Route
            path="/supplier-onboarding"
            element={
              <ProtectedRoute>
                <SupplierOnboarding />
              </ProtectedRoute>
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}