import axios from "axios";

/* ===============================
   Determine API Base URL
================================ */

const getBaseURL = (): string => {
  // 1️⃣ Production (Vercel environment variable)
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  // 2️⃣ Replit preview environment
  if (
    typeof window !== "undefined" &&
    window.location?.hostname?.includes("replit")
  ) {
    return window.location.origin;
  }

  // 3️⃣ Local development fallback
  return "http://localhost:5000";
};

const baseURL = getBaseURL();

console.log("🚨 API BASE URL =", baseURL);

/* ===============================
   Axios Instance
================================ */

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   Attach Auth Token Automatically
================================ */

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

/* ===============================
   Geo Types
================================ */

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  suburb: string;
  city: string;
  province: string;
}

export interface GeoApiResponse {
  ok: boolean;
  data?: GeocodedAddress;
  error?: string;
}

/* ===============================
   Geocode Address
================================ */

export async function geocodeAddress(
  address: string
): Promise<GeocodedAddress | null> {
  try {
    const response = await api.post<GeoApiResponse>(
      "/api/geo/geocode",
      { address }
    );

    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error("Geocode error:", error);
    return null;
  }
}

/* ===============================
   Reverse Geocode
================================ */

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress | null> {
  try {
    const response = await api.post<GeoApiResponse>(
      "/api/geo/reverse-geocode",
      { latitude, longitude }
    );

    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return null;
  }
}

/* ===============================
   Browser Location
================================ */

export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}