import { Navigate, Route, Routes } from "react-router-dom";

import GuestLayout from "@/layouts/GuestLayout";
import AppLayout from "@/layouts/AppLayout";
import OwnerLayout from "@/layouts/OwnerLayout";
import SupplierLayout from "@/layouts/SupplierLayout";

import RequireAuth from "@/components/RequireAuth";
import RoleDashboardRedirect from "@/components/RoleDashboardRedirect";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import MyDogs from "@/pages/my-dogs";
import DogProfilePage from "@/pages/dog-profile";

import SupplierDashboard from "@/pages/supplier-dashboard";
import SupplierProfile from "@/pages/supplier-profile";
import SupplierServices from "@/pages/supplier-services";
import SupplierAvailability from "@/pages/supplier-availability";
import SupplierPublicProfile from "@/pages/supplier-public-profile";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

import AdminDashboard from "@/pages/admin-dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC LANDING + AUTH */}
      <Route element={<GuestLayout />}>
        <Route index element={<Landing />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* PUBLIC/LOGGED-IN MIXED ROUTES */}
      <Route element={<AppLayout />}>
        <Route path="search" element={<Search />} />
        <Route path="supplier/:id" element={<SupplierPublicProfile />} />
      </Route>

      {/* GENERIC DASHBOARD REDIRECT */}
      <Route element={<RequireAuth />}>
        <Route path="dashboard" element={<RoleDashboardRedirect />} />
      </Route>

      {/* OWNER ROUTES */}
      <Route element={<RequireAuth allowRoles={["OWNER"]} />}>
        <Route element={<OwnerLayout />}>
          <Route path="owner/dashboard" element={<Dashboard />} />
          <Route path="owner/profile" element={<Profile />} />
          <Route path="owner/my-dogs" element={<MyDogs />} />
          <Route path="owner/dogs/:id" element={<DogProfilePage />} />
        </Route>
      </Route>

      {/* SUPPLIER ROUTES */}
      <Route element={<RequireAuth allowRoles={["SUPPLIER"]} />}>
        <Route element={<SupplierLayout />}>
          <Route path="supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="supplier/profile" element={<SupplierProfile />} />
          <Route path="supplier/services" element={<SupplierServices />} />
          <Route path="supplier/availability" element={<SupplierAvailability />} />
        </Route>
      </Route>

      {/* ADMIN ROUTE */}
      <Route element={<RequireAuth />}>
        <Route path="admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}