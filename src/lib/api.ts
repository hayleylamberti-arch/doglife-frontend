import axios from "axios";

/* ================================
   AXIOS INSTANCE
================================ */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
});

console.log("API BASE:", import.meta.env.VITE_API_BASE);

/* ================================
   REQUEST INTERCEPTOR (TOKEN)
================================ */

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  console.log("TOKEN USED:", token); // 👈 debug

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================================
   RESPONSE INTERCEPTOR
================================ */

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error("API ERROR:", error?.response || error);

    if (error?.response?.status === 401) {
      console.warn("Unauthorized — logging out");

      localStorage.removeItem("authToken");

      window.location.href = "/auth";
    }

    return Promise.reject(error);
  }
);

/* ================================
   HELPERS
================================ */

export const getMe = async () => {
  const res = await api.get("/api/me");
  return res.data.user;
};

export const logout = () => {
  localStorage.removeItem("authToken");
  window.location.href = "/auth";
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};