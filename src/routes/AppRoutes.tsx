import { Navigate, Route, Routes } from "react-router-dom";

import GuestLayout from "@/layouts/GuestLayout";
import AppLayout from "@/layouts/AppLayout";
import OwnerLayout from "@/layouts/OwnerLayout";
import SupplierLayout from "@/layouts/SupplierLayout";
import AdminLayout from "@/layouts/AdminLayout";

import RequireAuth from "@/components/RequireAuth";
import RoleDashboardRedirect from "@/components/RoleDashboardRedirect";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NotificationsPage from "@/pages/notifications";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import MyDogs from "@/pages/my-dogs";
import DogProfilePage from "@/pages/dog-profile";
import TrustAndSafetyPage from "@/pages/TrustAndSafetyPage";

import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsAndConditions from "@/pages/legal/TermsAndConditions";
import SupplierTerms from "@/pages/legal/SupplierTerms";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import RefundPolicy from "@/pages/legal/RefundPolicy";
import HealthSafetyPolicy from "@/pages/legal/HealthSafetyPolicy";
import TrustSafetyPolicy from "@/pages/legal/TrustSafetyPolicy";
import CommunityStandards from "@/pages/legal/CommunityStandards";
import Disclaimer from "@/pages/legal/Disclaimer";

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
import AdminSuppliersPage from "@/pages/admin-suppliers";
import AdminWaitlistPage from "@/pages/admin-waitlist";
import AdminUsersPage from "@/pages/admin-users";
import AdminSupplierDetailPage from "@/pages/admin-supplier-detail";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route index element={<Landing />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="search" element={<Search />} />
        <Route path="trust-and-safety" element={<TrustAndSafetyPage />} />
        <Route path="supplier/:id" element={<SupplierPublicProfile />} />

        <Route path="legal/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="legal/terms" element={<TermsAndConditions />} />
        <Route path="legal/supplier-terms" element={<SupplierTerms />} />
        <Route path="legal/cookies" element={<CookiePolicy />} />
        <Route path="legal/refunds" element={<RefundPolicy />} />
        <Route path="legal/health-safety" element={<HealthSafetyPolicy />} />
        <Route path="legal/trust-safety" element={<TrustSafetyPolicy />} />
<Route path="legal/community-standards" element={<CommunityStandards />} />
<Route path="legal/disclaimer" element={<Disclaimer />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="dashboard" element={<RoleDashboardRedirect />} />
      </Route>

      <Route element={<RequireAuth allowRoles={["OWNER"]} />}>
        <Route element={<OwnerLayout />}>
          <Route path="owner/dashboard" element={<Dashboard />} />
          <Route path="owner/search" element={<Search />} />
          <Route path="owner/notifications" element={<NotificationsPage />} />
          <Route path="owner/profile" element={<Profile />} />
          <Route path="owner/my-dogs" element={<MyDogs />} />
          <Route path="owner/dogs/:id" element={<DogProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowRoles={["SUPPLIER"]} />}>
        <Route element={<SupplierLayout />}>
          <Route path="supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="supplier/notifications" element={<NotificationsPage />} />
          <Route path="supplier/profile" element={<SupplierProfile />} />
          <Route path="supplier/services" element={<SupplierServices />} />
          <Route path="supplier/availability" element={<SupplierAvailability />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowRoles={["ADMIN"]} />}>
  <Route element={<AdminLayout />}>
    <Route path="admin" element={<AdminDashboard />} />
    <Route path="admin/suppliers" element={<AdminSuppliersPage />} />
    <Route path="admin/waitlist" element={<AdminWaitlistPage />} />
    <Route path="admin/users" element={<AdminUsersPage />} />
    <Route path="admin/suppliers/:id" element={<AdminSupplierDetailPage />} />
  </Route>
</Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}