import { Outlet } from "react-router-dom";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div style={{ background: "red", padding: 10 }}>
        TEST NAVBAR
      </div>

      <div className="pt-20 p-6">
  <Outlet />
</div>

    </div>
  );
}