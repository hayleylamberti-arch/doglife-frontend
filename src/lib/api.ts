import axios, { type InternalAxiosRequestConfig } from "axios";

const BACKEND_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ?? "https://doglife-backend.onrender.com";

export const api = axios.create({
  baseURL: `${BACKEND_ORIGIN}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token && config.url !== "/auth/reset-password") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.url?.startsWith("/api/")) {
    config.url = config.url.replace("/api", "");
  }

  return config;
});
