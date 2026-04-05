import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {
  const { id } = useParams();

  /* ================================
     FETCH SUPPLIER
  ================================ */

  const { data, isLoading } = useQuery({
    queryKey: ["supplierProfile", id],
    queryFn: async () => {
      const res = await api.get(`/api/public/suppliers/${id}`);
      return res.data;
    },
  });

  const supplier = data?.supplier;
  const services = supplier?.services ?? [];

  /* ================================
     FETCH USER DOGS 🐶
  ================================ */

  const { data: dogsData } = useQuery({
    queryKey: ["myDogs"],
    queryFn: async () => {
      const res = await api.get("/api/dogs");
      return res.data;
    },
  });

  const dogs = dogsData?.dogs || [];

  /* ================================
     BOOKING STATE
  ================================ */

  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDogs, setSelectedDogs] = useState<string[]>([]);

  /* ================================
     FETCH SLOTS
  ================================ */

  const {
    data: slotData,
    refetch: refetchSlots,
    isLoading: slotsLoading,
  } = useQuery({
    queryKey: ["slots", id, selectedService?.id, selectedDate],
    enabled: false,
    queryFn: async () => {
      const res = await api.get(
        `/api/suppliers/${id}/services/${selectedService.id}/bookable-slots`,
        {
          params: { date: selectedDate },
        }
      );
      return res.data;
    },
  });

  /* ================================
     CREATE BOOKING
  ================================ */

  const createBookingMutation = useMutation({
    mutationFn: async ({ start, end }: any) => {
      if (!selectedDogs.length) {
        alert("Please select at least one dog 🐶");
        return;
      }

      const res = await api.post("/api/bookings", {
        supplierId: supplier.id,
        supplierServiceId: selectedService?.id,
        startAt: start,
        endAt: end,
        dogIds: selectedDogs, // ✅ KEY ADDITION
      });

      return res.data;
    },
    onSuccess: () => {
      alert("Booking confirmed 🎉");
      window.location.href = "/dashboard";
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Booking failed");
    },
  });

  /* ================================
     LOAD STATES
  ================================ */

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!supplier) return <div className="p-6">Supplier not found</div>;

  /* ================================
     UI
  ================================ */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">{supplier.businessName}</h1>
        <p className="text-gray-500">{supplier.businessAddress}</p>
      </div>

      {/* ================================
         SERVICES
      ================================ */}

      <div className="border p-6 rounded space-y-4">
        <h2 className="text-xl font-semibold">Select a Service</h2>

        {services.map((service: any) => (
          <button
            key={service.id}
            onClick={() => {
              setSelectedService(service);
              setSelectedDate("");
            }}
            className={`w-full text-left p-3 border rounded ${
              selectedService?.id === service.id
                ? "bg-orange-50 border-orange-400"
                : ""
            }`}
          >
            <div className="flex justify-between">
              <span>{service.service}</span>
              <span>R {service.baseRateCents / 100}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ================================
         DOG SELECTION 🐶
      ================================ */}

      {selectedService && (
        <div className="border p-6 rounded space-y-4">
          <h2 className="text-xl font-semibold">Select Dog(s)</h2>

          {dogs.length === 0 && (
            <p className="text-gray-500">
              No dogs found. Please add a dog first.
            </p>
          )}

          {dogs.map((dog: any) => (
            <label
              key={dog.id}
              className="flex items-center gap-3 border p-3 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedDogs.includes(dog.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDogs([...selectedDogs, dog.id]);
                  } else {
                    setSelectedDogs(
                      selectedDogs.filter((d) => d !== dog.id)
                    );
                  }
                }}
              />
              <span>{dog.name}</span>
            </label>
          ))}
        </div>
      )}

      {/* ================================
         DATE PICKER
      ================================ */}

      {selectedService && (
        <div className="border p-6 rounded space-y-4">
          <h2 className="text-xl font-semibold">Select a Date</h2>

          <input
            type="date"
            className="border p-2"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <button
            onClick={() => {
              if (!selectedDate) {
                alert("Please select a date first");
                return;
              }
              refetchSlots();
            }}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Check Availability
          </button>
        </div>
      )}

      {/* ================================
         SLOTS
      ================================ */}

      {slotData && (
        <div className="border p-6 rounded space-y-6">

          <h2 className="text-xl font-semibold">Available Slots</h2>

          {slotsLoading && <p>Loading slots...</p>}

          {["morning", "afternoon", "evening"].map((period) => (
            <div key={period}>
              <h3 className="font-medium capitalize mb-2">{period}</h3>

              <div className="flex flex-wrap gap-2">
                {slotData.slots?.[period]?.map((slot: any) => (
                  <button
                    key={slot.start}
                    onClick={() =>
                      createBookingMutation.mutate({
                        start: slot.start,
                        end: slot.end,
                      })
                    }
                    className="border px-3 py-2 rounded hover:bg-black hover:text-white"
                  >
                    {new Date(slot.start).toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {slotData.totalSlots === 0 && (
            <p className="text-gray-500">No availability on this date</p>
          )}

        </div>
      )}

    </div>
  );
}