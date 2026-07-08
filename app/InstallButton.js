"use client";

import { useEffect, useState } from "react";
import { getDeferred, subscribe, promptInstall } from "@/lib/pwaInstall";
import { registerSW } from "@/lib/pushClient";

// Floating "Install app" pill — shown on every screen once the browser
// signals the app is installable.
export default function InstallButton() {
  const [avail, setAvail] = useState(false);

  useEffect(() => {
    registerSW();
    setAvail(!!getDeferred());
    return subscribe((d) => setAvail(!!d));
  }, []);

  if (!avail) return null;

  return (
    <button
      onClick={promptInstall}
      className="fixed z-[55] bottom-20 right-4 md:bottom-6 md:right-6 flex items-center gap-1.5 text-sm font-semibold bg-primary text-on-primary rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:opacity-90 active:scale-95 transition-all"
    >
      <span className="material-symbols-outlined !text-[18px]">install_mobile</span>
      Install app
    </button>
  );
}
