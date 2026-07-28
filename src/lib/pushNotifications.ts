import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isAppleMobileDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneWebApp() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function assertPushSupport() {
  if (isAppleMobileDevice() && !isStandaloneWebApp()) {
    throw new Error(
      "Push notifications are available when DogLife is installed on your Home Screen. Tap Share → Add to Home Screen, then open DogLife from its icon to enable notifications."
    );
  }

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error(
      "Push notifications are not available in this browser. You will still receive in-app and email notifications."
    );
  }
}

export async function registerPushNotifications() {
  assertPushSupport();

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission === "denied") {
    throw new Error(
      "Notifications are blocked for DogLife. Enable them in your device or browser settings and try again."
    );
  }

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted. You will still receive in-app and email notifications."
    );
  }

  const response = await api.get("/api/push/public-key");
  const vapidPublicKey = String(response.data?.publicKey || "").trim();

  if (!vapidPublicKey) {
    throw new Error(
      "Push notifications are temporarily unavailable. Please try again later."
    );
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

  const registration = await navigator.serviceWorker.ready;

  const existingSubscription =
    await registration.pushManager.getSubscription();

  const subscription =
    existingSubscription ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer.slice(
        applicationServerKey.byteOffset,
        applicationServerKey.byteOffset + applicationServerKey.byteLength
      ),
    }));

  try {
    await api.post("/api/push/subscribe", {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      userAgent: navigator.userAgent,
    });
  } catch {
    throw new Error(
      "DogLife could not finish enabling push notifications. Please try again."
    );
  }

  return subscription;
}