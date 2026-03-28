import axios, { type InternalAxiosRequestConfig } from "axios";

/* ================================
   Determine API Base URL
================================ */

const rawOrigin =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_ORIGIN ||
  "https://doglife-backend.onrender.com";

// Remove trailing slash + accidental /api duplication
const normalizedOrigin = rawOrigin
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

/* ================================
   Axios Instance
================================ */

export const api = axios.create({
  baseURL: `${normalizedOrigin}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================================
   Attach Auth Token Automatically
================================ */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  // Debug (keep for now)
  console.log("TOKEN:", token);

  // Skip auth header for reset password
  if (token && !config.url?.includes("reset-password")) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});