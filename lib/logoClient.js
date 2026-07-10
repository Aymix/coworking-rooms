"use client";

import { useEffect, useState } from "react";

// The logo is shown in every navbar. Fetch it once per page load, share it
// across components, and mirror it to localStorage so the next visit paints
// the real logo immediately instead of the fallback icon.
const CACHE_KEY = "cw_logo";

let value; // undefined = not loaded yet, "" = no logo set
let inflight = null;
const subscribers = new Set();

function readCache() {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    return v === null ? undefined : v;
  } catch (e) {
    return undefined;
  }
}

export function setLogo(next) {
  value = next || "";
  try {
    localStorage.setItem(CACHE_KEY, value);
  } catch (e) {}
  for (const fn of subscribers) fn(value);
}

function loadLogo() {
  if (!inflight) {
    inflight = fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLogo(d.logo || ""))
      .catch(() => {
        inflight = null; // let a later mount retry
      });
  }
  return inflight;
}

// undefined while loading, "" when no logo is set, otherwise a data URL.
export function useLogo() {
  const [logo, setState] = useState(undefined);

  useEffect(() => {
    setState(value !== undefined ? value : readCache());
    subscribers.add(setState);
    loadLogo();
    return () => subscribers.delete(setState);
  }, []);

  return logo;
}
