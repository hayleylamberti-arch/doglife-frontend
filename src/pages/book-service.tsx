import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function BookServicePage() {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  /* ===============================
     STATE
  =============================== */
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  /* ===============================
     LOAD SUPPLIER
  =============================== */
  const { data, isLoading } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: async () => {
      const res = await api.get(`/api/suppliers/${supplierId}`);
      return res.data;
    },
  });

  const supplier = data?.supplier ?? {};

  /* ===============================
     CREATE BOOKING
  =============================== */
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const startAt = new Date(`${date}T${time}`);

      return api.post("/api/bookings", {
        supplierId,
        serviceType,
        startAt,
      });
    },

    onSuccess: () => {
      alert("Booking request sent ✅");
      navigate("/dashboard");
    },

    onError: () => {
      alert("Failed to create booking ❌");
    },
  });

  /* ===============================
     LOADING
  =============================== */
  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  /* ===============================
     SUBMIT
  =============================== */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceType || !date || !time) {
      alert("Please complete all fields");
      return;
    }

    bookingMutation.mutate();
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Book {supplier.businessName}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SERVICE */}
        <div>
          <label className="block text-sm mb-1">Service</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select service</option>

            {(supplier.serviceTypes || []).map((service: string) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        {/* DATE */}
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-md p-2"
          />
        </div>

        {/* TIME */}
        <div>
          <label className="block text-sm mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border rounded-md p-2"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={bookingMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700"
        >
          {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
        </button>

      </form>

    </div>
  );
}