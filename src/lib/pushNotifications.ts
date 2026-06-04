import { api } from "@/lib/api";

const PUSH_DEBUG_VERSION = "push-debug-2026-06-04-v15";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(`Push notifications are not supported ${PUSH_DEBUG_VERSION}`);
  }

  const response = await api.get("/api/push/public-key");
  const vapidPublicKey = String(response.data?.publicKey || "").trim();

  if (!vapidPublicKey) {
    throw new Error(`No VAPID public key returned ${PUSH_DEBUG_VERSION}`);
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(`Notification permission not granted ${PUSH_DEBUG_VERSION}`);
  }

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

  const registration = await navigator.serviceWorker.ready;
  await registration.update();

  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer.slice(
  applicationServerKey.byteOffset,
  applicationServerKey.byteOffset + applicationServerKey.byteLength
),
    });

    await api.post("/api/push/subscribe", {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      userAgent: navigator.userAgent,
    });

    return subscription;
  } catch (error: any) {
    throw new Error(
      `${error?.message || "Push subscription failed"} keyBytes=${applicationServerKey.byteLength} endpoint=${registration.scope} ${PUSH_DEBUG_VERSION}`
    );
  }
}