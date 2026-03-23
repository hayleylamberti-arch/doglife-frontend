import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const SERVICES = [
  "BOARDING",
  "DAYCARE",
  "GROOMING",
  "WALKING",
  "PET_SITTING",
  "TRAINING",
  "PET_TRANSPORT",
  "MOBILE_VET"
];

function formatService(service: string) {
  const map: Record<string, string> = {
    WALKING: "🚶 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
    PET_SITTING: "🛏️ Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet"
  };

  return map[service] ?? service;
}

export default function SuppliersPage() {
  const [sp, setSp] = useSearchParams();

  const [suburb, setSuburb] = useState(sp.get("suburb") ?? "");
  const [service, setService] = useState(sp.get("service") ?? "");
  const [search, setSearch] = useState(sp.get("search") ?? "");

  const [limit] = useState(Number(sp.get("limit") ?? 10));
  const [page, setPage] = useState(Number(sp.get("page") ?? 1));

  /* ================================
     FETCH SUPPLIERS
  ================================ */

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-suppliers", { suburb, service, search, page, limit }],
    queryFn: async () => {
      const res = await api.get("/api/public/suppliers", {
        params: { suburb, service, search, page, limit }
      });
      return res.data;
    }
  });

  const suppliers = data?.suppliers ?? [];
  const totalPages = data?.totalPages ?? 1;

  /* ================================
     FETCH OWNER DOGS (for booking)
  ================================ */

  const { data: dogsData } = useQuery({
    queryKey: ["owner-dogs"],
    queryFn: async () => {
      const res = await api.get("/api/owner/dogs");
      return res.data;
    }
  });

  const dogs = dogsData?.dogs ?? [];

  /* ================================
     URL SYNC
  ================================ */

  useEffect(() => {
    const params: Record<string, string> = {};

    if (suburb) params.suburb = suburb;
    if (service) params.service = service;
    if (search) params.search = search;

    params.page = String(page);
    params.limit = String(limit);

    setSp(params, { replace: true });
  }, [suburb, service, search, page, limit, setSp]);

  /* ================================
     BOOKING HANDLER (MVP)
  ================================ */

  const handleBooking = async (supplier: any) => {
    try {
      if (!dogs.length) {
        alert("Please add a dog first");
        return;
      }

      // ⚠️ TEMP: using supplier.id (we will improve this later)
      await api.post("/api/bookings", {
        supplierServiceId: supplier.id,
        dogIds: [dogs[0].id],
        startAt: new Date().toISOString(),
        notes: "Quick booking test"
      });

      alert("Booking requested ✅");

    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Booking failed");
    }
  };

  /* ================================
     UI
  ================================ */

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">

      <h1 className="text-2xl font-semibold">
        Find Dog Service Providers
      </h1>

      {/* Filters */}

      <div className="grid gap-3 md:grid-cols-4 p-4 border rounded-lg">

        <input
          className="border rounded px-3 py-2"
          placeholder="Search provider..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <input
          className="border rounded px-3 py-2"
          placeholder="Suburb"
          value={suburb}
          onChange={(e) => {
            setPage(1);
            setSuburb(e.target.value);
          }}
        />

        <select
          className="border rounded px-3 py-2"
          value={service}
          onChange={(e) => {
            setPage(1);
            setService(e.target.value);
          }}
        >
          <option value="">All services</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {formatService(s)}
            </option>
          ))}
        </select>

      </div>

      {/* Loading */}

      {isLoading && <p>Loading providers...</p>}

      {/* Error */}

      {error && (
        <p className="text-red-600">
          Failed to load providers
        </p>
      )}

      {/* Supplier Cards */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {suppliers.map((s: any) => (

          <div
            key={s.id}
            className="border rounded-xl overflow-hidden bg-white shadow-sm"
          >

            <div className="h-44 bg-gray-200 flex items-center justify-center text-4xl">
              🐶
            </div>

            <div className="p-4 space-y-2">

              <h2 className="text-lg font-semibold">
                {s.businessName}
              </h2>

              <p className="text-sm text-gray-500">
                📍 {s.businessAddress ?? "Location not set"}
              </p>

              <div className="flex gap-2 pt-3">

                <Link
                  to={`/supplier/${s.id}`}
                  className="flex-1 text-center border py-2 rounded-md"
                >
                  View Profile
                </Link>

                <button
                  onClick={() => handleBooking(s)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md"
                >
                  Request Booking
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="flex justify-between pt-6">

          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ← Previous
          </button>

          <span>Page {page} of {totalPages}</span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </button>

        </div>
      )}

    </div>
  );
}