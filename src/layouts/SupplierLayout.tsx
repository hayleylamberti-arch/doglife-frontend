export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* 🔥 TEMP REMOVE THIS */}
      {/* <SupplierNavbar /> */}

      <div className="p-6">
        <Outlet />
      </div>

    </div>
  );
}