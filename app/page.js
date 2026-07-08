"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function Icon({ name, filled, size, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled-icon" : ""} ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}

const GREEN = "#008a00";

const ROLES = [
  {
    key: "visitor",
    title: "Visitor",
    desc: "See live room availability, floor plan and alerts.",
    icon: "person",
    tile: "from-[#0f766e] to-[#065f52]",
    href: "/visitor",
  },
  {
    key: "admin",
    title: "Admin",
    desc: "Sign in to schedule events and manage the rooms.",
    icon: "shield_person",
    tile: "from-primary-container to-[#0b1220]",
    href: "/admin",
  },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState("visitor");

  function next() {
    const role = ROLES.find((r) => r.key === selected);
    if (role) router.push(role.href);
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="flex items-center justify-center p-4 bg-surface-container-lowest sticky top-0 z-10 border-b border-solid border-surface-variant">
        <h1 className="text-lg font-bold tracking-tight text-on-surface">Coworking Rooms</h1>
      </header>

      {/* Content */}
      <main className="flex-grow p-5 flex flex-col max-w-lg mx-auto w-full">
        <section className="mt-4 mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-2 tracking-tight">
            Welcome
          </h2>
          <p className="text-on-surface-variant">
            Choose how you want to continue — pick your access level to see
            available workspaces and scheduled events.
          </p>
        </section>

        {/* Selection cards */}
        <div className="flex flex-col gap-4 mb-8">
          {ROLES.map((r) => {
            const active = selected === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setSelected(r.key)}
                onDoubleClick={() => router.push(r.href)}
                className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm border-2 border-solid text-left hover:shadow-md transition-all flex flex-row items-center gap-4"
                style={{ borderColor: active ? GREEN : "transparent" }}
              >
                <div
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gradient-to-br ${r.tile} flex items-center justify-center shrink-0`}
                >
                  <Icon name={r.icon} filled className="text-white !text-[40px] md:!text-[48px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-on-surface">{r.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">{r.desc}</p>
                </div>
                <span
                  className="material-symbols-outlined ml-auto shrink-0"
                  style={{ color: active ? GREEN : "#9aa0a6" }}
                >
                  {active ? "check_circle" : "radio_button_unchecked"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next */}
        <div className="mt-auto pb-4 flex justify-end">
          <button
            onClick={next}
            className="text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
            style={{ backgroundColor: GREEN }}
          >
            Next
            <Icon name="arrow_forward" size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
