import { useEffect, useState } from "react";

const DISMISS_KEY = "doglife_install_prompt_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type BrowserType = "ios-safari" | "ios-chrome" | "ios-edge" | "ios-firefox" | "chrome" | "edge" | "firefox" | "other";

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

function getBrowser(): BrowserType {
  if (typeof window === "undefined") return "other";

  const ua = window.navigator.userAgent;
  const lowerUa = ua.toLowerCase();

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS && /CriOS/i.test(ua)) return "ios-chrome";
  if (isIOS && /EdgiOS/i.test(ua)) return "ios-edge";
  if (isIOS && /FxiOS/i.test(ua)) return "ios-firefox";
  if (isIOS && /Safari/i.test(ua)) return "ios-safari";

  if (lowerUa.includes("edg/")) return "edge";
  if (lowerUa.includes("chrome")) return "chrome";
  if (lowerUa.includes("firefox")) return "firefox";

  return "other";
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [browser, setBrowser] = useState<BrowserType>("other");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandaloneMode()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    if (dismissed) return;

    setBrowser(getBrowser());
    setVisible(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;

    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const instruction = installEvent
    ? "Install DogLife for quicker access from your device."
    : browser === "ios-safari"
    ? "On iPhone or iPad, tap the Share icon in Safari, then tap Add to Home Screen."
    : browser === "ios-chrome"
    ? "On iPhone or iPad in Chrome, tap the Share icon, then tap Add to Home Screen."
    : browser === "ios-edge"
    ? "On iPhone or iPad in Edge, tap the menu or Share icon, then choose Add to Home Screen if available."
    : browser === "ios-firefox"
    ? "On iPhone or iPad in Firefox, open the menu or Share options and look for Add to Home Screen."
    : browser === "chrome"
    ? "In Chrome, use the Install button or open the browser menu and choose Install app."
    : browser === "edge"
    ? "In Edge, use the Install button or open the browser menu and choose Apps, then Install this site."
    : browser === "firefox"
    ? "In Firefox, open the browser menu and look for Add to Home screen or Install."
    : "Open your browser menu and look for Install app or Add to Home Screen.";

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Install DogLife on your Home Screen
          </p>
          <p className="mt-1 text-sm text-amber-800">{instruction}</p>
        </div>

        <div className="flex items-center gap-2">
          {installEvent ? (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Install
            </button>
          ) : null}

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