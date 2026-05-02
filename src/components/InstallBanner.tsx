import { useEffect, useState } from "react";

const DISMISS_KEY = "doglife_ios_install_banner_dismissed";

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isSafari =
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua);

  return isIOS && isSafari;
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";

    if (!dismissed && isIosSafari() && !isInStandaloneMode()) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Install DogLife on your Home Screen
          </p>
          <p className="mt-1 text-sm text-amber-800">
            On iPhone or iPad, tap the <span className="font-semibold">Share</span>{" "}
            icon in Safari, then tap{" "}
            <span className="font-semibold">Add to Home Screen</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
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