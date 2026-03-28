import { Navigate, Route, Routes } from "react-router-dom";
import GuestLayout from "@/layouts/GuestLayout";
import OwnerLayout from "@/layouts/OwnerLayout";
import SupplierLayout from "@/layouts/SupplierLayout";
import RequireAuth from "@/components/RequireAuth";
import RoleDashboardRedirect from "@/components/RoleDashboardRedirect";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import SupplierDashboard from "@/pages/supplier-dashboard";
import SupplierProfile from "@/pages/supplier-profile";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route index element={<Landing />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="dashboard" element={<RoleDashboardRedirect />} />
      </Route>

      <Route element={<RequireAuth allowRoles={["OWNER"]} />}>
        <Route element={<OwnerLayout />}>
          <Route path="owner/dashboard" element={<Dashboard />} />
          <Route path="owner/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowRoles={["SUPPLIER"]} />}>
        <Route element={<SupplierLayout />}>
          <Route path="supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="supplier/profile" element={<SupplierProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
