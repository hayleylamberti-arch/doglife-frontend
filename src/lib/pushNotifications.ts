import { api } from "@/lib/api";

const PUSH_DEBUG_VERSION = "push-debug-2026-06-04-v12";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerPushNotifications() {
  console.log("Push debug version:", PUSH_DEBUG_VERSION);

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(
      `Push notifications are not supported ${PUSH_DEBUG_VERSION}`
    );
  }

  // Fetch VAPID key from backend
  const response = await api.get("/api/push/public-key");

  const vapidPublicKey = String(response.data?.publicKey || "").trim();

  if (!vapidPublicKey) {
    throw new Error(
      `No VAPID public key returned ${PUSH_DEBUG_VERSION}`
    );
  }

  const applicationServerKey =
    urlBase64ToUint8Array(vapidPublicKey);

  console.log(
    "Key bytes:",
    applicationServerKey.byteLength
  );

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      `Notification permission not granted ${PUSH_DEBUG_VERSION}`
    );
  }

  const registration =
    await navigator.serviceWorker.register("/sw.js");

  const existingSubscription =
    await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }

  try {
    const subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

    await api.post("/api/push/subscribe", {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      userAgent: navigator.userAgent,
    });

    return subscription;
  } catch (error: any) {
    throw new Error(
      `${error?.message || "Push subscription failed"} keyBytes=${applicationServerKey.byteLength} ${PUSH_DEBUG_VERSION}`
    );
  }
}