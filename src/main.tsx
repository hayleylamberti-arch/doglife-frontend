import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  useLocation,
} from "react-router-dom";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import App from "./App";
import "./index.css";

import { AuthProvider } from "@/hooks/useAuth";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  isSensitiveHoldPath,
  normalizeSensitivePath,
  sanitizeSensitiveTelemetryValue,
} from "@/lib/safeReturnPath";

const queryClient = new QueryClient();

const posthogEnabled = Boolean(
  import.meta.env.VITE_POSTHOG_TOKEN
);

const initialSensitiveRoute =
  typeof window !== "undefined" &&
  isSensitiveHoldPath(window.location.pathname);

let posthogSensitiveMode = initialSensitiveRoute;
let lastCapturedLocationKey: string | null = null;

function sanitizeSentryValue<T>(value: T): T {
  return sanitizeSensitiveTelemetryValue(value);
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    beforeSend(event) {
      return sanitizeSentryValue(event);
    },
    beforeBreadcrumb(breadcrumb) {
      return sanitizeSentryValue(breadcrumb);
    },
    beforeSendSpan(span) {
      return sanitizeSentryValue(span);
    },
  });
}

if (posthogEnabled) {
  posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
    api_host:
      import.meta.env.VITE_POSTHOG_HOST ||
      "https://app.posthog.com",

    /*
     * Send a Slot v1 security boundary:
     *
     * BookingHold route tokens are bearer capabilities.
     *
     * Automatic pageviews, DOM autocapture and session replay
     * are deliberately disabled globally for v1 so that no
     * automatic browser telemetry path can observe and persist
     * /book/hold/<raw-token>.
     *
     * Intentional/custom PostHog events remain enabled.
     * Router pageviews are emitted manually below after
     * sensitive paths have been normalized.
     */
    capture_pageview: false,
    autocapture: false,
    disable_session_recording: true,

    /*
     * A direct initial load of a sensitive hold URL must never
     * initialize browser persistence first.
     */
    persistence: initialSensitiveRoute
      ? "memory"
      : "localStorage+cookie",

    before_send(event) {
      return sanitizeSensitiveTelemetryValue(event);
    },
  });
}

function TelemetryPageviews() {
  const location = useLocation();
  const wasSensitive = useRef(initialSensitiveRoute);

  useEffect(() => {
    if (!posthogEnabled) {
      return;
    }

    const sensitive = isSensitiveHoldPath(
      location.pathname
    );

    /*
     * Internal navigation into a hold route:
     * switch to memory persistence before intentionally
     * capturing the sanitized pageview.
     *
     * Automatic pageview/autocapture/session replay remain
     * disabled globally, so they are not relied upon as
     * runtime security controls.
     */
    if (sensitive && !posthogSensitiveMode) {
      posthog.set_config({
        persistence: "memory",
      });

      posthogSensitiveMode = true;
    }

    /*
     * Leaving a hold route:
     * clear the temporary in-memory PostHog identity/session
     * state before restoring ordinary browser persistence.
     *
     * No raw hold URL is copied into restored persistence.
     */
    if (!sensitive && wasSensitive.current) {
      posthog.reset();

      posthog.set_config({
        persistence: "localStorage+cookie",
      });

      posthogSensitiveMode = false;
    }

    const pageviewKey =
      location.key ||
      `${location.pathname}${location.search}${location.hash}`;

    if (lastCapturedLocationKey !== pageviewKey) {
      lastCapturedLocationKey = pageviewKey;

      const normalizedPath = normalizeSensitivePath(
        location.pathname
      );

      const normalizedUrl =
        sanitizeSensitiveTelemetryValue(
          `${window.location.origin}${location.pathname}${location.search}${location.hash}`
        );

      posthog.capture("$pageview", {
        $pathname: normalizedPath,
        $current_url: normalizedUrl,
      });
    }

    wasSensitive.current = sensitive;
  }, [
    location.hash,
    location.key,
    location.pathname,
    location.search,
  ]);

  return null;
}

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <BrowserRouter>
        <TelemetryPageviews />

        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
);
