type ApiEnvironment = {
  VITE_API_BASE?: string;
  VITE_API_URL?: string;
  VITE_API_BASE_URL?: string;
};

const PET_VISITS_REVIEW_API_ORIGIN =
  "https://doglife-pet-visits-it-20260924.onrender.com";

export function isPetVisitsReviewPreview(environment: string | undefined) {
  // This source tree is review-only: every Preview built from it must fail closed.
  return environment === "preview";
}

export function validateReviewApiBase(env: ApiEnvironment): string {
  const base = env.VITE_API_BASE?.trim();
  if (!base) throw new Error("Pet Visits review Preview requires VITE_API_BASE");

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new Error("Pet Visits review Preview requires a valid HTTPS API origin");
  }

  if (
    url.origin !== PET_VISITS_REVIEW_API_ORIGIN ||
    url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
    base !== url.origin
  ) {
    throw new Error("Pet Visits review Preview requires the temporary Render HTTPS origin");
  }

  for (const key of ["VITE_API_URL", "VITE_API_BASE_URL"] as const) {
    const other = env[key]?.trim();
    if (other && other !== base) throw new Error(`${key} conflicts with VITE_API_BASE`);
  }

  return base;
}

export function configuredApiBase(base = import.meta.env?.VITE_API_BASE): string | undefined {
  return base?.replace(/\/$/, "");
}

export function apiUrl(path: string, base = configuredApiBase()): string {
  if (!path.startsWith("/api/")) throw new Error("API path must start with /api/");
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}

export function queryApiUrl(path: string, base = configuredApiBase()): string {
  return path.startsWith("/api/") ? apiUrl(path, base) : path;
}
