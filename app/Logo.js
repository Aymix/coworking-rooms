"use client";

import { useLogo } from "@/lib/logoClient";

// The admin-uploaded logo, with the built-in mark as a fallback.
// `size` is the rendered height in px; wide logos keep their aspect ratio.
export default function Logo({ size = 28, className = "" }) {
  const logo = useLogo();

  if (logo === undefined) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block rounded-md bg-surface-container-high ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (!logo) {
    return (
      <span
        className={`material-symbols-outlined filled-icon text-primary ${className}`}
        style={{ fontSize: size }}
      >
        domain
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt="Logo"
      className={`w-auto object-contain ${className}`}
      style={{ height: size, maxWidth: size * 4 }}
    />
  );
}
