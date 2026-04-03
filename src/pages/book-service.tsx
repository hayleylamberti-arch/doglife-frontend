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
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");

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
     LOAD SLOTS
  =============================== */
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", supplierId, serviceId, date],
    enabled: !!supplierId && !!serviceId && !!date,
    queryFn: async () => {
      const res = await api.get(
        `/api/suppliers/${supplierId}/services/${serviceId}/bookable-slots?date=${date}`
      );
      return res.data;
    },
  });

  /* ===============================
     CREATE BOOKING
  =============================== */
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const start = new Date(selectedSlot);

      // Default duration = 30 mins (we’ll make dynamic later)
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      return api.post("/api/bookings", {
        supplierId,
        serviceId,
        startAt: start,
        endAt: end,
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

    if (!serviceId || !date || !selectedSlot) {
      alert("Please select service, date and time");
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SERVICE */}
        <div>
          <label className="block text-sm mb-1">Service</label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setSelectedSlot(""); // reset slot when service changes
            }}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select service</option>

            {(supplier.services || []).map((service: any) => (
              <option key={service.id} value={service.id}>
                {service.service}
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
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(""); // reset slot when date changes
            }}
            className="w-full border rounded-md p-2"
          />
        </div>

        {/* SLOTS */}
        {slotsData && (
          <div className="space-y-4">

            {["morning", "afternoon", "evening"].map((period) => (
              <div key={period}>
                <h3 className="font-medium capitalize">{period}</h3>

                <div className="flex flex-wrap gap-2 mt-2">
                  {(slotsData?.slots?.[period] || []).map((slot: any) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot.start)}
                      className={`px-3 py-2 rounded border ${
                        selectedSlot === slot.start
                          ? "bg-blue-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      {new Date(slot.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* No slots message */}
            {slotsData.totalSlots === 0 && (
              <div className="text-sm text-gray-500">
                No availability for this date
              </div>
            )}

          </div>
        )}

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