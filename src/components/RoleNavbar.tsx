import OwnerNavbar from "./OwnerNavbar";
import SupplierNavbar from "./SupplierNavbar";
import { useAuth } from "@/hooks/use-auth";

export default function RoleNavbar() {
  const { user } = useAuth();

  if (user?.role === "SUPPLIER") {
    return <SupplierNavbar />;
  }

  return <OwnerNavbar />;
}