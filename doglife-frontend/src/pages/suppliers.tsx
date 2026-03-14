import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SupplierPage } from "@/types";

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

/* Service label formatter with icons */

function formatService(service: string) {

  const map: Record<string,string> = {
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
  const [q, setQ] = useState(sp.get("q") ?? "");

  const [limit] = useState(Number(sp.get("limit") ?? 20));
  const [offset, setOffset] = useState(Number(sp.get("offset") ?? 0));

  useEffect(() => {

    const params: Record<string, string> = {};

    if (suburb) params.suburb = suburb;
    if (service) params.service = service;
    if (q) params.q = q;

    if (limit !== 20) params.limit = String(limit);
    if (offset) params.offset = String(offset);

    setSp(params, { replace: true });

  }, [suburb, service, q, limit, offset, setSp]);

  const debouncedQ = useDebounced(q, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ["suppliers", { suburb, service, q: debouncedQ, limit, offset }],
    queryFn: async () => {

      const { data } = await api.get<SupplierPage>(
        "/api/suppliers",
        {
          params: { suburb, service, q: debouncedQ, limit, offset }
        }
      );

      return data;

    }
  });

  const total = data?.total ?? 0;

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">

      <h1 className="text-2xl font-semibold">
        Find Dog Service Providers
      </h1>

      {/* Sticky Search Filters */}

      <div className="sticky top-16 bg-white z-10 grid gap-3 md:grid-cols-4 p-4 border rounded-lg">

        <input
          className="border rounded px-3 py-2"
          placeholder="Search provider..."
          value={q}
          onChange={(e) => {
            setOffset(0);
            setQ(e.target.value);
          }}
        />

        <input
          className="border rounded px-3 py-2"
          placeholder="Suburb"
          value={suburb}
          onChange={(e) => {
            setOffset(0);
            setSuburb(e.target.value);
          }}
        />

        <select
          className="border rounded px-3 py-2"
          value={service}
          onChange={(e) => {
            setOffset(0);
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

      {/* Empty State */}

      {!isLoading && data?.items.length === 0 && (

        <div className="text-center py-20">

          <div className="text-5xl mb-4">
            🐶
          </div>

          <h3 className="text-lg font-semibold">
            No providers found
          </h3>

          <p className="text-muted-foreground mt-2">
            Try adjusting your filters or searching another suburb.
          </p>

        </div>

      )}

      {/* Supplier Cards */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {data?.items.map((s) => (

          <div
            key={s.userId}
            className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition hover:-translate-y-1 duration-200"
          >

            {/* Provider Image */}

            <div className="h-44 bg-gray-200 flex items-center justify-center text-4xl">
              🐶
            </div>

            {/* Card Content */}

            <div className="p-4 space-y-2">

              <h2 className="text-lg font-semibold">
                {s.businessName}
              </h2>

              <div className="text-sm text-yellow-500">
                ⭐ 4.9 <span className="text-gray-500">(120 reviews)</span>
              </div>

              <p className="text-sm text-gray-500">
                📍 {s.suburb ?? "Unknown location"}
              </p>

              {/* Services */}

              <div className="flex flex-wrap gap-2 pt-1">
                {(s.serviceTypes ?? []).slice(0,3).map((service: string) => (
                  <span
                    key={service}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                  >
                    {formatService(service)}
                  </span>
                ))}
              </div>

              {/* Trust signals */}

              <div className="text-xs text-gray-500 pt-2 space-y-1">
                <div>✔ Responds quickly</div>
                <div>✔ Trusted provider</div>
              </div>

              {/* Price */}

              <p className="text-sm font-medium pt-2">
                From R150
              </p>

              {/* Actions */}

              <div className="flex gap-2 pt-3">

                <Link
                  to={`/supplier/${s.userId}`}
                  className="flex-1 text-center border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                >
                  View Profile
                </Link>

                <button
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Request Booking
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* Pagination */}

      {total > limit && (

        <div className="flex justify-between pt-6">

          <button
            className="border rounded px-4 py-2 disabled:opacity-50"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            ← Previous
          </button>

          <button
            className="border rounded px-4 py-2 disabled:opacity-50"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
          >
            Next →
          </button>

        </div>

      )}

    </div>
  );
}

/* Debounce search */

function useDebounced<T>(value: T, ms = 300) {

  const [v, setV] = useState(value);

  useEffect(() => {

    const id = setTimeout(() => setV(value), ms);

    return () => clearTimeout(id);

  }, [value, ms]);

  return v;
}