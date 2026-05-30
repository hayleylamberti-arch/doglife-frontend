import { api } from "@/lib/api";

const VAPID_PUBLIC_KEY =
  "BMZU08aWaHHWw1X7rXkevWbsJ2DMKSFjArrehhVzm20ZnLkklenNKa71yy_BIct5gFzXGa-kvCSi_wD5g4DY6mE";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported on this device.");
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  const existingSubscription = await registration.pushManager.getSubscription();

  const subscription =
    existingSubscription ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  await api.post("/api/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: subscription.toJSON().keys,
    userAgent: navigator.userAgent,
  });

  return subscription;
}