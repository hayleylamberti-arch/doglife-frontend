import axios from "axios";

/* ================================
   SESSION KEYS
================================ */

const TOKEN_KEY = "authToken";
const ROLE_KEY = "role";

/* ================================
   AXIOS INSTANCE
================================ */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
});

console.log("API BASE:", import.meta.env.VITE_API_BASE);

/* ================================
   SESSION HELPERS
================================ */

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);

  // Clean up old localStorage auth values
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

/* ================================
   REQUEST INTERCEPTOR (TOKEN)
================================ */

api.interceptors.request.use((config) => {
  const token = getToken();

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
      console.warn("Unauthorized — clearing session");
      clearAuthSession();
    }

    return Promise.reject(error);
  }
);

/* ================================
   HELPERS
================================ */

export const getMe = async () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const res = await api.get("/api/me");
    return res.data.user;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      clearAuthSession();
      return null;
    }

    throw error;
  }
};

export const logout = () => {
  clearAuthSession();
  window.location.href = "/auth/login";
};

export const isAuthenticated = () => {
  return !!getToken();
};