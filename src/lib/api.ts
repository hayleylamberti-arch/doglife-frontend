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
   OLD TOKEN CLEANUP
================================ */

export function clearAuthSession() {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("role");

  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

/* ================================
   RESPONSE INTERCEPTOR
================================ */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearAuthSession();
    }

    return Promise.reject(error);
  }
);

/* ================================
   HELPERS
================================ */

export const getMe = async () => {
  try {
    const res = await api.get("/api/auth/me");
    return res.data.user;
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearAuthSession();
      return null;
    }

    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearAuthSession();
    window.location.replace("/auth/login");
  }
};

export const isAuthenticated = async () => {
  const user = await getMe();
  return Boolean(user);
};