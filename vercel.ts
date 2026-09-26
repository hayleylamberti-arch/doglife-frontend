import process from "node:process";
import { routes, type VercelConfig } from "@vercel/config/v1";
import { isPetVisitsReviewPreview } from "./src/lib/api-base";

type ApiEnvironment = {
  VITE_API_BASE?: string;
  VITE_API_URL?: string;
  VITE_API_BASE_URL?: string;
};

const PET_VISITS_REVIEW_API_ORIGIN =
  "https://doglife-pet-visits-it-20260924.onrender.com";

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
    url.origin !== PET_VISITS_REVIEW_API_ORIGIN ||
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

const reviewPreview = isPetVisitsReviewPreview(
  process.env.VERCEL_ENV,
  process.env.VERCEL_GIT_COMMIT_REF,
);

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