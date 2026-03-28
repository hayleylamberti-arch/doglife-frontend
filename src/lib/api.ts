import axios, { type InternalAxiosRequestConfig } from "axios";

/* ================================
   Determine API Base URL
================================ */

const BACKEND_ORIGIN =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_ORIGIN ||
  "https://doglife-backend.onrender.com";

/* ================================
   Axios Instance
================================ */

export const api = axios.create({
  baseURL: `${BACKEND_ORIGIN}/api`,
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

  // Skip auth header for reset password
  if (token && !config.url?.includes("reset-password")) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});