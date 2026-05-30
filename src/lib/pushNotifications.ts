import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerPushNotifications() {
  try {
    if (!("serviceWorker" in navigator)) return;

    const permission = await Notification.requestPermission();

    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/sw.js");

    const vapidPublicKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY;

    const subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(vapidPublicKey),
      });

    await api.post("/api/push/subscribe", {
  endpoint: subscription.endpoint,
  keys: subscription.toJSON().keys,
  userAgent: navigator.userAgent,
});

    console.log("✅ Push notifications enabled");
  } catch (error) {
    console.error("❌ Push setup failed", error);
  }
}