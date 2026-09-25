import process from "node:process";
import { routes, type VercelConfig } from "@vercel/config/v1";

type ApiEnvironment = {
  VITE_API_BASE?: string;
  VITE_API_URL?: string;
  VITE_API_BASE_URL?: string;
};

function isPetVisitsReviewPreview(environment: string | undefined) {
  return environment === "preview";
}

function validateReviewApiBase(env: ApiEnvironment): string {
  const base = env.VITE_API_BASE?.trim();

  if (!base) {
    throw new Error("Pet Visits review Preview requires VITE_API_BASE");
  }

  let url: URL;

  try {
    url = new URL(base);
  } catch {
    throw new Error(
      "Pet Visits review Preview requires a valid HTTPS API origin",
    );
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".onrender.com") ||
    url.hostname === "doglife-backend-dev.onrender.com" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    base !== url.origin
  ) {
    throw new Error(
      "Pet Visits review Preview requires the temporary Render HTTPS origin",
    );
  }

  for (const key of ["VITE_API_URL", "VITE_API_BASE_URL"] as const) {
    const other = env[key]?.trim();

    if (other && other !== base) {
      throw new Error(`${key} conflicts with VITE_API_BASE`);
    }
  }

  return base;
}

const reviewPreview = isPetVisitsReviewPreview(process.env.VERCEL_ENV);

const apiOrigin = reviewPreview
  ? validateReviewApiBase({
      VITE_API_BASE: process.env.VITE_API_BASE,
      VITE_API_URL: process.env.VITE_API_URL,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
    })
  : "https://api.doglife.app";

export const config: VercelConfig = {
  buildCommand: "npm run build",
  outputDirectory: "dist",
  framework: "vite",
  rewrites: [
    routes.rewrite("/api/:path*", `${apiOrigin}/api/:path*`),
    routes.rewrite("/(.*)", "/index.html"),
  ],
};