"use client";

import { useEffect, useState } from "react";
import { getDeferred, subscribe, promptInstall } from "@/lib/pwaInstall";
import { registerSW } from "@/lib/pushClient";

// Material Symbols has no brand logos, so the platform marks are inline SVG.
const APPLE_PATH =
  "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z";
const ANDROID_PATH =
  "M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z";

function BrandMark({ path, size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// Floating "Install app" pill — shown on every screen.
// Chrome/Android use the native beforeinstallprompt; iOS Safari has no such
// API, so we detect iOS and show Add-to-Home-Screen instructions instead.
export default function InstallButton({ side = "right", inline = false, nav = false, className = "" }) {
  const [avail, setAvail] = useState(false); // native prompt captured
  const [ios, setIos] = useState(false); // iOS Safari, not yet installed
  const [installed, setInstalled] = useState(false); // running as an installed PWA
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    registerSW();
    setAvail(!!getDeferred());
    const unsub = subscribe((d) => setAvail(!!d));

    const mq = window.matchMedia("(display-mode: standalone)");
    const isStandalone = () =>
      window.navigator.standalone === true || mq.matches;

    setInstalled(isStandalone());
    const onDisplayChange = () => setInstalled(isStandalone());
    mq.addEventListener?.("change", onDisplayChange);

    const ua = window.navigator.userAgent || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS && !isStandalone()) setIos(true);

    return () => {
      unsub();
      mq.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  // Once installed and launched as a PWA, never offer to install again.
  if (installed || (!avail && !ios)) return null;

  const pos = side === "left" ? "left-4 md:left-6" : "right-4 md:right-6";

  function onClick() {
    if (avail) promptInstall();
    else setShowIos(true);
  }

  const cls = nav
    ? className || "text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95 transition-colors"
    : inline
    ? "flex items-center gap-1.5 text-sm font-semibold text-secondary border-2 border-solid border-secondary rounded-full px-4 py-2.5 hover:bg-secondary hover:text-on-secondary active:scale-95 transition-all"
    : `fixed z-[55] bottom-20 md:bottom-6 ${pos} flex items-center gap-1.5 text-sm font-semibold bg-primary text-on-primary rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:opacity-90 active:scale-95 transition-all`;

  return (
    <>
      <button onClick={onClick} aria-label="Install app" title="Install app" className={cls}>
        <span className="flex items-center gap-1 leading-none">
          <BrandMark path={APPLE_PATH} />
          <span className="opacity-40 text-sm font-normal">|</span>
          <BrandMark path={ANDROID_PATH} />
        </span>
        {!nav && "Install app"}
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
