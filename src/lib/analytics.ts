import posthog from "posthog-js";

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (!import.meta.env.VITE_POSTHOG_TOKEN) return;

  posthog.capture(eventName, {
    app: "doglife",
    environment: import.meta.env.MODE,
    ...properties,
  });
}