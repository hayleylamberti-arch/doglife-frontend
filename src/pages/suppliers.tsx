import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SupplierPage } from "@/types";

const SERVICES = ["BOARDING","DAYCARE","GROOMING","WALKING","PET_SITTING","TRAINING","PET_TRANSPORT","MOBILE_VET"];

export default function SuppliersPage() {
  const [sp, setSp] = useSearchParams();
  const [suburb, setSuburb] = useState(sp.get("suburb") ?? "");
  const [service, setService] = useState(sp.get("service") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [limit, setLimit] = useState(Number(sp.get("limit") ?? 20));
  const [offset, setOffset] = useState(Number(sp.get("offset") ?? 0));

  useEffect(() => {
    const params: Record<string,string> = {};
    if (suburb) params.suburb = suburb;
    if (service) params.service = service;
    if (q) params.q = q;
    if (limit !== 20) params.limit = String(limit);
    if (offset) params.offset = String(offset);
    setSp(params, { replace: true });
  }, [suburb, service, q, limit, offset, setSp]);

  const debouncedQ = useDebounced(q, 300);
  const { data, isLoading, error } = useQuery({
    queryKey: ["suppliers",{ suburb, service, q: debouncedQ, limit, offset }],
    queryFn: async () => {
      const { data } = await api.get<SupplierPage>("/api/suppliers", { 
        params: { suburb, service, q: debouncedQ, limit, offset }
      });
      return data;
    },
  });

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Suppliers</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Search name/website…" 
          value={q} 
          onChange={e => { setOffset(0); setQ(e.target.value); }} 
        />
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Suburb" 
          value={suburb} 
          onChange={e => { setOffset(0); setSuburb(e.target.value); }} 
        />
        <select 
          className="border rounded px-3 py-2" 
          value={service} 
          onChange={e => { setOffset(0); setService(e.target.value); }}
        >
          <option value="">All services</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select 
          className="border rounded px-3 py-2" 
          value={limit} 
          onChange={e => { setOffset(0); setLimit(Number(e.target.value)); }}
        >
          {[10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">Failed to load</p>}
      {data && (
        <>
          <p className="text-sm text-muted-foreground">Showing {data.items.length} of {total}</p>
          <ul className="divide-y rounded border">
            {data.items.map(s => (
              <li key={s.userId} className="p-3">
                <div className="font-medium">{s.businessName}</div>
                <div className="text-sm text-muted-foreground">{s.suburb ?? "—"} · {s.websiteUrl ?? "—"}</div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-3">
            <button 
              className="border rounded px-3 py-1 disabled:opacity-50" 
              onClick={() => setOffset(Math.max(0, offset - limit))} 
              disabled={offset === 0}
            >
              ← Prev
            </button>
            <span className="text-sm">Page {Math.floor(offset/limit)+1} / {pageCount}</span>
            <button 
              className="border rounded px-3 py-1 disabled:opacity-50" 
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