import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";

export default function BookServicePage() {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [bookingAddress, setBookingAddress] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: async () => {
      const res = await api.get(`/api/suppliers/${supplierId}`);
      return res.data;
    },
  });

  const { data: ownerProfileData } = useQuery({
    queryKey: ["owner-profile"],
    queryFn: async () => {
      const res = await api.get("/api/owner/profile");
      return res.data;
    },
  });

  const supplier = data?.supplier ?? {};
  const ownerProfile = ownerProfileData?.profile ?? {};
  const savedAddress = ownerProfile?.address || "";

  const selectedService = useMemo(() => {
    return (supplier.services || []).find((service: any) => service.id === serviceId);
  }, [supplier.services, serviceId]);

  const isHomeService = ["WALKING", "PET_SITTING", "TRAINING", "MOBILE_VET", "PET_TRANSPORT"].includes(
    selectedService?.service
  );

  const effectiveAddress = useSavedAddress ? savedAddress : bookingAddress;

  const { data: slotsData } = useQuery({
    queryKey: ["slots", supplierId, serviceId, date],
    enabled: !!supplierId && !!serviceId && !!date,
    queryFn: async () => {
      const res = await api.get(
        `/api/suppliers/${supplierId}/services/${serviceId}/bookable-slots?date=${date}`
      );
      return res.data;
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const start = new Date(selectedSlot);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const notes = isHomeService
        ? `Service location: OWNER_HOME. Owner address: ${effectiveAddress}.`
        : undefined;

      return api.post("/api/bookings", {
        supplierId,
        supplierServiceId: serviceId,
        startAt: start,
        endAt: end,
        dogIds: selectedDogIds,
        notes,
      });
    },
    onSuccess: () => {
      alert("Booking request sent ✅");
      navigate("/owner/dashboard");
    },
    onError: (err) => {
      console.error("BOOKING ERROR:", err);
      alert("Failed to create booking ❌");
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  const handleDogToggle = (dogId: string) => {
    setSelectedDogIds((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceId || !date || !selectedSlot) {
      alert("Please select service, date and time");
      return;
    }

    if (selectedDogIds.length === 0) {
      alert("Please select at least one dog");
      return;
    }

    if (isHomeService && !effectiveAddress.trim()) {
      alert("Please add an address for this booking");
      return;
    }

    bookingMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Book {supplier.businessName}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Service</label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setSelectedSlot("");
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

        {Array.isArray(ownerProfile.dogs) && ownerProfile.dogs.length > 0 ? (
          <div>
            <label className="block text-sm mb-2">Select dog</label>
            <div className="space-y-2">
              {ownerProfile.dogs.map((dog: any) => (
                <label key={dog.id} className="flex items-center gap-2 border rounded-md p-2">
                  <input
                    type="checkbox"
                    checked={selectedDogIds.includes(dog.id)}
                    onChange={() => handleDogToggle(dog.id)}
                  />
                  <span>{dog.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {isHomeService ? (
          <div className="border rounded-md p-4 bg-gray-50 space-y-3">
            <p className="font-medium">Service address</p>

            {savedAddress ? (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={useSavedAddress}
                  onChange={(e) => setUseSavedAddress(e.target.checked)}
                />
                <span className="text-sm">Use my saved home address: {savedAddress}</span>
              </label>
            ) : (
              <p className="text-sm text-gray-500">No saved home address found.</p>
            )}

            {!useSavedAddress || !savedAddress ? (
              <textarea
                value={bookingAddress}
                onChange={(e) => setBookingAddress(e.target.value)}
                placeholder="Enter address for this booking"
                className="w-full border rounded-md p-2"
                rows={3}
              />
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot("");
            }}
            className="w-full border rounded-md p-2"
          />
        </div>

        {slotsData ? (
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
                        selectedSlot === slot.start ? "bg-blue-600 text-white" : "bg-white"
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

            {slotsData.totalSlots === 0 ? (
              <div className="text-sm text-gray-500">No availability for this date</div>
            ) : null}
          </div>
        ) : null}

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