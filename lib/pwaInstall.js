"use client";

// Shared PWA-install store. The browser fires `beforeinstallprompt` once, early
// — we capture it in a module-level variable so any screen can show the button
// no matter which one mounted first.
let deferred = null;
const subs = new Set();

function notify() {
  subs.forEach((fn) => fn(deferred));
}

if (typeof window !== "undefined" && !window.__cwInstallInit) {
  window.__cwInstallInit = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function getDeferred() {
  return deferred;
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export async function promptInstall() {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  notify();
}
