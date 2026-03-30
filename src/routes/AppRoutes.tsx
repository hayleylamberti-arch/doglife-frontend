import { Navigate, Route, Routes } from "react-router-dom";

import GuestLayout from "@/layouts/GuestLayout";
import OwnerLayout from "@/layouts/OwnerLayout";
import SupplierLayout from "@/layouts/SupplierLayout";

import RequireAuth from "@/components/RequireAuth";
import RoleDashboardRedirect from "@/components/RoleDashboardRedirect";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import MyDogs from "@/pages/my-dogs";

import SupplierDashboard from "@/pages/supplier-dashboard";
import SupplierProfile from "@/pages/supplier-profile";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ========================= */}
      {/* PUBLIC ROUTES */}
      {/* ========================= */}
      <Route element={<GuestLayout />}>
        <Route index element={<Landing />} />
        <Route path="search" element={<Search />} /> {/* ✅ ONLY HERE */}
        <Route path="supplier/:id" element={<SupplierProfile />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* ========================= */}
      {/* GENERIC DASHBOARD REDIRECT */}
      {/* ========================= */}
      <Route element={<RequireAuth />}>
        <Route path="dashboard" element={<RoleDashboardRedirect />} />
      </Route>

      {/* ========================= */}
      {/* OWNER ROUTES */}
      {/* ========================= */}
      <Route element={<RequireAuth allowRoles={["OWNER"]} />}>
        <Route element={<OwnerLayout />}>

          <Route path="owner/dashboard" element={<Dashboard />} />
          <Route path="owner/profile" element={<Profile />} />
          <Route path="owner/my-dogs" element={<MyDogs />} />

        </Route>
      </Route>

      {/* ========================= */}
      {/* SUPPLIER ROUTES */}
      {/* ========================= */}
      <Route element={<RequireAuth allowRoles={["SUPPLIER"]} />}>
        <Route element={<SupplierLayout />}>

          <Route path="supplier/dashboard" element={<SupplierProfile />} />
          <Route path="supplier/profile" element={<SupplierProfile />} />

        </Route>
      </Route>

      {/* ========================= */}
      {/* FALLBACK */}
      {/* ========================= */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}