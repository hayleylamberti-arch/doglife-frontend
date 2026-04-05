import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

/* ================================
   REQUEST INTERCEPTOR (TOKEN)
================================ */

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================================
   GLOBAL API HELPERS
================================ */

// 🔑 Get current logged-in user
export const getMe = async () => {
  const res = await api.get("/api/me");
  return res.data.user;
};

// (Optional but useful)
// Logout helper
export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
};

// (Optional)
// Check if user is logged in (basic)
export const isAuthenticated = () => {
  return (
    !!localStorage.getItem("authToken") ||
    !!localStorage.getItem("token")
  );
};