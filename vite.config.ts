import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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

if (reviewPreview) {
  validateReviewApiBase({
    VITE_API_BASE: process.env.VITE_API_BASE,
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
  });
}

export default defineConfig({
  plugins: [react()],

  /*
   * The deployment still requires and validates VITE_API_BASE so Vercel can
   * safely proxy /api/* to the temporary Render backend.
   *
   * In the browser bundle for this isolated Preview, however, API requests
   * must remain same-origin so Safari can retain the HttpOnly auth cookie.
   */
  ...(reviewPreview
    ? {
        define: {
          "import.meta.env.VITE_API_BASE": JSON.stringify(""),
        },
      }
    : {}),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
  },

  server: {
    port: 5173,
    open: true,
  },
});