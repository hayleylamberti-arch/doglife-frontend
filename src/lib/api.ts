import axios from "axios";

/* ================================
   AXIOS INSTANCE
================================ */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true, // 🔥 CRITICAL
});

console.log("API BASE:", import.meta.env.VITE_API_BASE);

/* ================================
   REQUEST INTERCEPTOR (TOKEN)
================================ */

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================================
   RESPONSE INTERCEPTOR (DEBUG + ERROR)
================================ */

api.interceptors.response.use(
  (response) => {
    // ✅ Helpful debug log (you can remove later)
    console.log("API RESPONSE:", response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error("API ERROR:", error?.response || error);

    // 🚨 If token expired → force logout
    if (error?.response?.status === 401) {
      console.warn("Unauthorized — logging out");
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");

      // Optional: redirect to login
      window.location.href = "/auth";
    }

    return Promise.reject(error);
  }
);

/* ================================
   GLOBAL API HELPERS
================================ */

// 🔑 Get current logged-in user
export const getMe = async () => {
  const res = await api.get("/api/me");
  return res.data.user;
};

// 🚪 Logout helper
export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  window.location.href = "/auth";
};

// 🔍 Check if user is logged in
export const isAuthenticated = () => {
  return (
    !!localStorage.getItem("authToken") ||
    !!localStorage.getItem("token")
  );
};