import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl, queryApiUrl } from "./api-base";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const method = options?.method || "GET";
  const token = localStorage.getItem("authToken");

  /*
   * An explicitly empty VITE_API_BASE is intentional in the isolated
   * Pet Visits Vercel Preview. It keeps browser requests same-origin
   * so /api/* is handled by the Vercel rewrite.
   *
   * An undefined VITE_API_BASE keeps the existing local-development
   * fallback behaviour.
   */
  const configuredBase = import.meta.env.VITE_API_BASE;

  const baseURL =
    configuredBase === ""
      ? ""
      : configuredBase ||
        (window?.location?.hostname?.includes("replit.dev")
          ? `https://${window.location.hostname.replace(/\d+/, "00")}`
          : "http://localhost:5000");

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  const fullUrl =
    configuredBase === ""
      ? normalizedPath
      : configuredBase && url.startsWith("/api/")
        ? apiUrl(url)
        : `${baseURL}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: options?.body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("authToken");

    const path = queryKey[0] as string;

    const res = await fetch(queryApiUrl(path), {
      credentials: "include",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});