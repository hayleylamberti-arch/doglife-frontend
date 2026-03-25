import OwnerNavbar from "./OwnerNavbar";
import SupplierNavbar from "./SupplierNavbar";
import GuestNavbar from "./GuestNavbar";
import { useAuth } from "@/hooks/useAuth";

export default function RoleNavbar() {
  const { user, isLoading } = useAuth();

  // While restoring session, avoid flashing wrong navbar
  if (isLoading) {
    return null;
  }

  if (!user) {
    return <GuestNavbar />;
  }

  if (user.role === "SUPPLIER") {
    return <SupplierNavbar />;
  }

  return <OwnerNavbar />;
}