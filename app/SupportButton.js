"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { SUPPORT_CONTACTS, telHref, formatPhone } from "@/lib/support";

const EN = {
  support: "Support",
  supportTitle: "Need help?",
  supportDesc: "Call the team — someone is always around.",
  call: "Call",
};

// The visitor screen passes its own `t`; everywhere else falls back to English.
const en = (key) => EN[key];

// The contact list on its own — the home screen shows it inline, the popup wraps it.
export function SupportContacts({ t = en }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {SUPPORT_CONTACTS.map((c) => (
        <a
          key={c.phone}
          href={telHref(c.phone)}
          aria-label={`${t("call")} ${c.name}`}
          className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-solid border-outline-variant/40 px-3 py-2 hover:bg-secondary-container hover:border-transparent active:scale-[0.99] transition-colors group"
        >
          <span className="material-symbols-outlined text-secondary !text-[18px] shrink-0">call</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primary leading-tight truncate">{c.name}</span>
            <span className="block text-xs text-on-surface-variant tabular-nums truncate">
              {formatPhone(c.phone)}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

// `nav` renders a round icon button for top bars; `row` a full-width sidebar row.
export default function SupportButton({ nav = false, row = false, t = en }) {
  const [open, setOpen] = useState(false);

  const cls = row
    ? "w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant rounded-full px-4 py-3 transition-all text-left"
    : "text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95 transition-colors";

  return (
    <>
      <button
        type="button" // the visitor gate renders this inside its check-in form
        onClick={() => setOpen(true)}
        aria-label={t("support")}
        title={t("support")}
        className={cls}
      >
        <span className={`material-symbols-outlined ${nav ? "!text-[18px]" : ""}`}>
          support_agent
        </span>
        {row && <span className="text-base">{t("support")}</span>}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          // Portaled to <body> so the sheet escapes any parent header's
          // stacking context (a z-40 top bar would otherwise let the z-50
          // bottom nav paint over the sheet's lower edge).
          <div
            className="fixed inset-0 z-[80] bg-on-background/40 flex items-end md:items-center justify-center p-0 md:p-6"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-surface-container-lowest w-full md:max-w-md rounded-t-2xl md:rounded-2xl ambient-shadow p-6 pb-10 md:pb-6 max-h-[85vh] overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-1 gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined filled-icon">support_agent</span>
                  </span>
                  <h3 className="text-xl font-bold text-primary">{t("supportTitle")}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-on-surface-variant hover:bg-surface-variant rounded-full p-2 active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-on-surface-variant mb-5">{t("supportDesc")}</p>
              <SupportContacts t={t} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
