import { api } from "@/lib/api";

const PUSH_DEBUG_VERSION = "push-debug-2026-05-30-v3";

const VAPID_PUBLIC_KEY =
  "BMV129g1mXV14P6T2WDD181bmWn1HYcdOU1JtWXE45zvobR63WtDoA_JQyGbsLPpDiPnbmXeTBhdm0020k7_AzY";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerPushNotifications() {
  console.log("Push debug version:", PUSH_DEBUG_VERSION);
  console.log("VAPID key length:", VAPID_PUBLIC_KEY.length);

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(`Push notifications are not supported on this device. ${PUSH_DEBUG_VERSION}`);
  }

  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  console.log("Decoded VAPID key length:", applicationServerKey.length);

  if (applicationServerKey.length !== 65) {
    throw new Error(
      `Invalid VAPID key length: ${applicationServerKey.length}. ${PUSH_DEBUG_VERSION}`
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
}