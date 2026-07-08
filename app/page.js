"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GREEN = "rgb(0, 138, 0)";
const PASS_KEY = "cw_visitor_pass";

const ROLES = [
  {
    key: "visitor",
    title: "Visitor",
    trailing: "door_open",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXeX8kVuuu85gl9xLMo6E5RNOQXuPmGZmEbq7OG11nX6oALVAch9-6zzBMmiXox4CyUdqE1JhKKMPF5IV62ovtnE-RALNR2sbOOl6EsZ98sg5b66gzCC5alVYiM7OhT1AMsfCS15ck4kWL98pW0SPZUQNXM_13ABUyNJHRIJ7qLEwoh0S_cjumfwvJdTgiSrjjZGe14kR3l57KWVRZHPZIce-V4XItmW-9jhRHWbieTZj24nUqhhieLMC5Dz3qAhef1A",
    alt: "Cat illustration",
  },
  {
    key: "admin",
    title: "Admin",
    trailing: "door_front",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXZfsEEtLp0Y2g-OChKS9Aa76sYVykye6CA0_jm1xlGAs-kMl-O70Kz74RINCSzqbrP0Xi0tn6evdt8uabFST3mpj53oZ2ai7PcSCFRAnS5_X4BMiq3SD1zTL7AeYU00Cku-zzDXxXesYDOZ5zo2CabyZ19lJVgwz27wkEROw2NxwCNFrJzgEHlVw0o9G4TxViSwEi9bpkAntuVa6CHMcksXN5AhaGApxpajdm_ftaltyKhYFf3Xap5xFa2JnyTDWF8A",
    alt: "Rodent illustration",
  },
  {
    key: "guest",
    title: "Guest",
    trailing: "door_front",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA98pygzKtI9IOE7ZPj64HqFFPhilKX9gaAa9kLiQT1ZpXp27AMK0eoeuMhHpltwEv0ZRgEhPad0TFCLmcNs94tEBk9XWt4wVElpF11BWyZ3i1TabF5BkYuMH893cB49QFST90TtpsiOcd88-iSpTDrx0_GVPKbqJSOT35FIfl6sW-6gfbJoREPutkv7EuwN0lQoFng9AZ5pvugt5xGMb-wnCSc__Mctehmu6uWHaCBCV87WzQuH7C3MX6oMXnl8Szv4w",
    alt: "Dog illustration",
  },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState("visitor");

  function next() {
    if (selected === "admin") {
      router.push("/admin");
    } else if (selected === "guest") {
      // Guest: no login, no check-in — go straight to the board.
      try {
        localStorage.setItem(PASS_KEY, "1");
      } catch (e) {}
      router.push("/visitor");
    } else {
      router.push("/visitor");
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased bg-surface text-on-surface">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-surface-container-lowest sticky top-0 z-10 border-b border-solid border-surface-variant">
        <button aria-label="Menu" className="p-2 text-primary hover:bg-surface-container-low rounded-full transition-colors">
          <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <h1 className="text-[18px] font-bold tracking-tight text-on-surface">Kinetic Workspaces</h1>
        <button aria-label="Notifications" className="p-2 text-primary hover:bg-surface-container-low rounded-full transition-colors">
          <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      {/* Main */}
      <main className="flex-grow p-5 flex flex-col max-w-lg mx-auto w-full">
        <section className="mt-4 mb-6 text-center">
          <h2 className="text-[26px] leading-8 font-bold text-on-surface mb-2 tracking-tight">
            Coworking Rooms
          </h2>
          <p className="text-on-surface-variant text-base">Choose how you want to continue</p>
          <p className="text-on-surface-variant text-sm mt-2">
            Select your access level to see available workspaces and scheduled events.
          </p>
        </section>

        {/* Selection cards */}
        <div className="flex gap-4 mb-8 flex-col">
          {ROLES.map((r) => {
            const active = selected === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setSelected(r.key)}
                onDoubleClick={next}
                className={`w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm border-2 border-solid text-left hover:shadow-md transition-all flex flex-row items-center gap-4 ${
                  active ? "" : "border-transparent hover:border-surface-variant"
                }`}
                style={active ? { borderColor: GREEN } : undefined}
              >
                <img alt={r.alt} className="w-24 h-24 object-cover rounded-lg" src={r.img} />
                <h3 className="text-xl font-semibold text-on-surface">{r.title}</h3>
                <span className="material-symbols-outlined text-on-surface-variant ml-auto">
                  {r.trailing}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next */}
        <div className="mt-auto pb-4 flex justify-end">
          <button
            onClick={next}
            className="bg-[#008a00] hover:bg-[#007000] text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
