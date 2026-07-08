"use client";

import { useEffect, useState } from "react";
import { getDeferred, subscribe, promptInstall } from "@/lib/pwaInstall";
import { registerSW } from "@/lib/pushClient";

// Floating "Install app" pill — shown on every screen.
// Chrome/Android use the native beforeinstallprompt; iOS Safari has no such
// API, so we detect iOS and show Add-to-Home-Screen instructions instead.
export default function InstallButton({ side = "right" }) {
  const [avail, setAvail] = useState(false); // native prompt captured
  const [ios, setIos] = useState(false); // iOS Safari, not yet installed
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    registerSW();
    setAvail(!!getDeferred());
    const unsub = subscribe((d) => setAvail(!!d));

    const ua = window.navigator.userAgent || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !standalone) setIos(true);

    return unsub;
  }, []);

  if (!avail && !ios) return null;

  const pos = side === "left" ? "left-4 md:left-6" : "right-4 md:right-6";

  function onClick() {
    if (avail) promptInstall();
    else setShowIos(true);
  }

  return (
    <>
      <button
        onClick={onClick}
        className={`fixed z-[55] bottom-20 md:bottom-6 ${pos} flex items-center gap-1.5 text-sm font-semibold bg-primary text-on-primary rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:opacity-90 active:scale-95 transition-all`}
      >
        <span className="material-symbols-outlined !text-[18px]">
          {ios ? "ios_share" : "install_mobile"}
        </span>
        Install app
      </button>

      {showIos && (
        <div
          className="fixed inset-0 z-[70] bg-on-background/40 flex items-end justify-center"
          onClick={() => setShowIos(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-t-2xl ambient-shadow p-6 pb-10 m-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-primary">Install this app</h3>
              <button
                onClick={() => setShowIos(false)}
                className="text-on-surface-variant hover:bg-surface-variant rounded-full p-2 active:scale-95"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              On iPhone, add it to your Home Screen from Safari:
            </p>
            <ol className="flex flex-col gap-3">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined !text-[20px]">ios_share</span>
                </span>
                <span className="text-sm text-primary">
                  Tap the <b>Share</b> button in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined !text-[20px]">add_box</span>
                </span>
                <span className="text-sm text-primary">
                  Choose <b>Add to Home Screen</b>.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined !text-[20px]">check</span>
                </span>
                <span className="text-sm text-primary">
                  Tap <b>Add</b> — done. Open it from your Home Screen.
                </span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
