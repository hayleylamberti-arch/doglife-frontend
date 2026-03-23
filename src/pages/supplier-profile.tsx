import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {
  const { id } = useParams();
  const isPublicView = Boolean(id);

  /* ================================
     FETCH SUPPLIER PROFILE + SERVICES
  ================================ */

  const { data, isLoading } = useQuery({
    queryKey: ["supplierProfile", id],
    queryFn: async () => {
      if (isPublicView) {
        const res = await api.get(`/api/public/suppliers/${id}`);
        return res.data;
      } else {
        const res = await api.get("/api/supplier/profile");
        return res.data;
      }
    },
  });

  /* ================================
     FETCH OWNER DOGS
  ================================ */

  const { data: dogsData } = useQuery({
    queryKey: ["owner-dogs"],
    queryFn: async () => {
      const res = await api.get("/api/owner/dogs");
      return res.data;
    },
  });

  const dogs = dogsData?.dogs ?? [];

  /* ================================
     EXTRACT DATA
  ================================ */

  const supplier = isPublicView ? data?.supplier : data?.profile;

  const services = supplier?.services ?? []; // 🔥 IMPORTANT

  /* ================================
     STATE
  ================================ */

  const [selectedService, setSelectedService] = useState("");
  const [selectedDog, setSelectedDog] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState("");

  /* ================================
     BOOKING MUTATION
  ================================ */

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService) throw new Error("Select a service");
      if (!selectedDog) throw new Error("Select a dog");
      if (!selectedDateTime) throw new Error("Select a time");

      return api.post("/api/bookings", {
        supplierServiceId: selectedService, // ✅ FIXED
        dogIds: [selectedDog],
        startAt: new Date(selectedDateTime).toISOString(),
        notes: "Booking from UI"
      });
    },
    onSuccess: () => {
      alert("Booking requested ✅");
      setSelectedDateTime("");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || err.message);
    }
  });

  /* ================================
     LOADING
  ================================ */

  if (isLoading) {
    return <div className="p-6">Loading provider...</div>;
  }

  if (!supplier) {
    return <div className="p-6 text-red-600">Supplier not found</div>;
  }

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">

      {/* HEADER */}
      <div className="grid md:grid-cols-3 gap-6">

        <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-5xl">
          🐶
        </div>

        <div className="md:col-span-2 space-y-3">

          <h1 className="text-3xl font-semibold">
            {supplier.businessName}
          </h1>

          <p className="text-muted-foreground">
            📍 {supplier.businessAddress}
          </p>

          <p className="text-sm">
            {supplier.aboutServices}
          </p>

        </div>
      </div>

      {/* ================================
         BOOKING SECTION
      ================================ */}

      {isPublicView && (
        <div className="border rounded-xl p-6 bg-white shadow-sm space-y-4">

          <h2 className="text-xl font-semibold">
            Request Booking
          </h2>

          {/* SERVICE SELECTOR */}
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="">Select service</option>

            {services.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.service} — R{(s.baseRateCents / 100).toFixed(0)}
              </option>
            ))}
          </select>

          {/* DOG SELECTOR */}
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedDog}
            onChange={(e) => setSelectedDog(e.target.value)}
          >
            <option value="">Select your dog</option>

            {dogs.map((dog: any) => (
              <option key={dog.id} value={dog.id}>
                {dog.name}
              </option>
            ))}
          </select>

          {/* DATE TIME */}
          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2"
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
          />

          {/* BUTTON */}
          <button
            onClick={() => bookingMutation.mutate()}
            disabled={bookingMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700"
          >
            {bookingMutation.isPending ? "Booking..." : "Request Booking"}
          </button>

        </div>
      )}

    </div>
  );
}