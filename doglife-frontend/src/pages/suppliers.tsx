import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  "MOBILE_VET",
];

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [suburb, setSuburb] = useState(sp.get("suburb") ?? "");
  const [service, setService] = useState(sp.get("service") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [limit, setLimit] = useState(Number(sp.get("limit") ?? 20));
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
      const { data } = await api.get<SupplierPage>("/api/suppliers", {
        params: { suburb, service, q: debouncedQ, limit, offset },
      });
      return data;
    },
  });

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-semibold">Find Dog Service Providers</h1>
        <p className="text-muted-foreground">
          Search and compare trusted providers in your area
        </p>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4">

        <input
          className="border rounded px-3 py-2"
          placeholder="Search business name..."
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
              {s}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-3 py-2"
          value={limit}
          onChange={(e) => {
            setOffset(0);
            setLimit(Number(e.target.value));
          }}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="text-muted-foreground">Loading suppliers...</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-600">Failed to load suppliers</p>
      )}

      {/* Results */}
      {data && (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {data.items.length} of {total}
          </p>

          {/* Supplier Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

  {data.items.map((s) => (
    <div
      key={s.userId}
      className="bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
    >

      {/* Image placeholder */}
      <div className="h-40 bg-gray-200 flex items-center justify-center text-4xl">
        🐶
      </div>

      <div className="p-4 space-y-2">

        <div className="text-lg font-semibold">
          {s.businessName}
        </div>

        <div className="text-sm text-yellow-500">
          ⭐ 4.9 (89 reviews)
        </div>

        <div className="text-sm text-muted-foreground">
          📍 {s.suburb ?? "Location unavailable"}
        </div>

        <div className="text-sm text-muted-foreground">
          Dog Walking • Boarding
        </div>

        <div className="text-blue-600 font-medium">
          From R150 / walk
        </div>

        <button
          className="w-full mt-3 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => navigate(`/supplier/${s.userId}`)}
        >
          View Profile
        </button>

      </div>
    </div>
  ))}

</div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6">

            <button
              className="border rounded px-4 py-2 disabled:opacity-50"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              ← Previous
            </button>

            <span className="text-sm">
              Page {Math.floor(offset / limit) + 1} / {pageCount}
            </span>

            <button
              className="border rounded px-4 py-2 disabled:opacity-50"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Next →
            </button>

          </div>
        </>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);

  return v;
}