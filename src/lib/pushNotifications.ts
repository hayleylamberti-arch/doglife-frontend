import { api } from "@/lib/api";

const PUSH_DEBUG_VERSION = "push-debug-2026-06-04-v9";

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

async function getVapidPublicKey() {
  const res = await api.get("/api/push/public-key");
  const publicKey = res.data?.publicKey;

  if (!publicKey || typeof publicKey !== "string") {
    throw new Error(`Missing VAPID public key ${PUSH_DEBUG_VERSION}`);
  }

  return publicKey.trim();
}

export async function registerPushNotifications() {
  console.log("Push debug version:", PUSH_DEBUG_VERSION);

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(
      `Push notifications are not supported on this device ${PUSH_DEBUG_VERSION}`
    );
  }

  const vapidPublicKey = await getVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  console.log("Decoded key bytes:", applicationServerKey.byteLength);
  console.log("First key byte:", applicationServerKey[0]);

  if (applicationServerKey.byteLength !== 65 || applicationServerKey[0] !== 4) {
    throw new Error(
      `Invalid VAPID public key keyBytes=${applicationServerKey.byteLength} firstByte=${applicationServerKey[0]} ${PUSH_DEBUG_VERSION}`
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      `Notification permission was not granted ${PUSH_DEBUG_VERSION}`
    );
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  await navigator.serviceWorker.ready;

  const existingSubscription =
    await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }

  try {
    const subscription = await registration.pushManager.subscribe({
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
      `${error?.message || "Push subscription failed"} keyBytes=${applicationServerKey.byteLength} firstByte=${applicationServerKey[0]} ${PUSH_DEBUG_VERSION}`
    );
  }
}