import { useEffect, useState } from "react";

const DISMISS_KEY = "doglife_install_prompt_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getBrowser(): "ios" | "edge" | "chrome" | "firefox" | "other" {
  if (typeof window === "undefined") return "other";

  const ua = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome") && !ua.includes("edg/")) return "chrome";
  if (ua.includes("firefox")) return "firefox";

  return "other";
}

export default function InstallBanner() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [browser, setBrowser] =
    useState<"ios" | "edge" | "chrome" | "firefox" | "other">("other");

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setBrowser(getBrowser());

    if (isStandaloneMode()) return;

    const alreadyDismissed = localStorage.getItem(DISMISS_KEY);
    if (alreadyDismissed === "true") {
      setDismissed(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;

    setInstallEvent(null);
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (dismissed || isStandaloneMode()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Install DogLife on your Home Screen
          </p>

          {installEvent ? (
            <p className="mt-1 text-sm text-amber-800">
              Install DogLife for quicker access from your device.
            </p>
          ) : browser === "ios" ? (
            <p className="mt-1 text-sm text-amber-800">
              On iPhone or iPad, tap the{" "}
              <span className="font-semibold">Share</span> icon in Safari, then
              tap <span className="font-semibold">Add to Home Screen</span>.
            </p>
          ) : browser === "firefox" ? (
            <p className="mt-1 text-sm text-amber-800">
              Open your browser menu and look for{" "}
              <span className="font-semibold">Add to Home screen</span> or{" "}
              <span className="font-semibold">Install</span>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-amber-800">
              Open your browser menu and choose{" "}
              <span className="font-semibold">Install app</span> or{" "}
              <span className="font-semibold">Add to Home screen</span>.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {installEvent && (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Install
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}