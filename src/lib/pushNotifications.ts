import { api } from "@/lib/api";

const PUSH_DEBUG_VERSION = "push-debug-2026-06-04-v6";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}

export async function registerPushNotifications() {
  console.log("Push debug version:", PUSH_DEBUG_VERSION);
  console.log("VAPID key length:", VAPID_PUBLIC_KEY.length);

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(`Push notifications are not supported on this device. ${PUSH_DEBUG_VERSION}`);
  }

  const applicationServerKey = urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY);

  console.log("Decoded VAPID key byte length:", applicationServerKey.byteLength);

  if (applicationServerKey.byteLength !== 65) {
    throw new Error(
      `Invalid VAPID key byte length: ${applicationServerKey.byteLength}. ${PUSH_DEBUG_VERSION}`
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(`Notification permission was not granted. ${PUSH_DEBUG_VERSION}`);
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  const existingSubscription = await registration.pushManager.getSubscription();

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
  `${error?.message || "Push subscription failed"} keyBytes=${applicationServerKey.byteLength} keyChars=${VAPID_PUBLIC_KEY.length} ${PUSH_DEBUG_VERSION}`
);
  }
}