import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SupplierProfilePage() {

  /* ================================
     FETCH SUPPLIER
  ================================ */

  const { data: profileData, isLoading } = useQuery({
  queryKey: ["supplierProfile"],
  queryFn: async () => {
    const res = await api.get("/api/supplier/profile");
    return res.data.profile;
  },
});

  const supplier = profileData;
  const services = supplier?.services ?? [];
  const gallery = supplier?.galleryUrls ?? [];

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

  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  /* ================================
     FETCH SLOTS
  ================================ */

  const {
  data: slotData,
  refetch: refetchSlots,
  isLoading: slotsLoading,
} = useQuery({
  queryKey: ["slots", supplier?.id, selectedService?.id, selectedDate],
  enabled: false,
  queryFn: async () => {
    const res = await api.get(
      `/api/suppliers/${supplier.id}/services/${selectedService.id}/bookable-slots`,
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
        dogIds: selectedDogs,
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
    <div className="max-w-6xl mx-auto p-6 space-y-10">

      {/* ================================
   HERO + GALLERY (INTERACTIVE)
================================ */}

{gallery.length > 0 && (
  <div className="grid md:grid-cols-3 gap-3 rounded-2xl overflow-hidden">

    {/* HERO IMAGE */}
    <div className="md:col-span-2">
      <img
        src={gallery[0]}
        onClick={() => setActiveImageIndex(0)}
        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
      />
    </div>

    {/* SIDE IMAGES */}
    <div className="grid grid-rows-2 gap-3">
      {gallery.slice(1, 3).map((img: string, i: number) => (
        <img
          key={i}
          src={img}
          onClick={() => setActiveImageIndex(i + 1)}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
        />
      ))}
    </div>

  </div>
)}

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">{supplier.businessName}</h1>
        <p className="text-gray-500">{supplier.businessAddress}</p>
      </div>

      {/* ABOUT */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="font-semibold text-lg mb-2">About</h2>
        <p className="text-gray-600">{supplier.aboutServices}</p>
      </div>

      {/* SERVICES */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>

        {services.map((service: any) => (
          <button
            key={service.id}
            onClick={() => {
              setSelectedService(service);
              setSelectedDate("");
            }}
            className={`w-full text-left p-4 border rounded-xl flex justify-between ${
              selectedService?.id === service.id
                ? "bg-orange-50 border-orange-400"
                : ""
            }`}
          >
            <span>{service.service}</span>
            <span className="font-semibold">
              R {service.baseRateCents / 100}
            </span>
          </button>
        ))}
      </div>

      {/* DOG SELECTION */}
      {selectedService && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Select Dog(s)</h2>

          {dogs.map((dog: any) => (
            <label key={dog.id} className="flex gap-3">
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
              {dog.name}
            </label>
          ))}
        </div>
      )}

      {/* DATE PICKER */}
      {selectedService && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2"
          />

          <button
            onClick={() => refetchSlots()}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Check Availability
          </button>
        </div>
      )}

      {/* SLOTS */}
      {slotData && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          {slotData.slots?.morning?.map((slot: any) => (
            <button
              key={slot.start}
              onClick={() =>
                createBookingMutation.mutate({
                  start: slot.start,
                  end: slot.end,
                })
              }
              className="border px-3 py-2 rounded"
            >
              {new Date(slot.start).toLocaleTimeString("en-ZA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))}
        </div>
      )}

      {/* ================================
   FULLSCREEN IMAGE VIEWER
================================ */}

{activeImageIndex !== null && (
  <div
    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    onClick={() => setActiveImageIndex(null)}
  >
    <div className="relative max-w-5xl w-full px-4">

      {/* IMAGE */}
      <img
        src={gallery[activeImageIndex]}
        className="w-full max-h-[80vh] object-contain rounded-xl"
      />

      {/* CLOSE BUTTON */}
      <button
        className="absolute top-4 right-4 text-white text-2xl"
        onClick={() => setActiveImageIndex(null)}
      >
        ✕
      </button>

      {/* LEFT ARROW */}
      {activeImageIndex > 0 && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-3xl"
          onClick={(e) => {
            e.stopPropagation();
            setActiveImageIndex(activeImageIndex - 1);
          }}
        >
          ←
        </button>
      )}

      {/* RIGHT ARROW */}
      {activeImageIndex < gallery.length - 1 && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-3xl"
          onClick={(e) => {
            e.stopPropagation();
            setActiveImageIndex(activeImageIndex + 1);
          }}
        >
          →
        </button>
      )}

    </div>
  </div>
)}

    </div>
  );
}