"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import InstallButton from "./InstallButton";

const GREEN = "rgb(0, 138, 0)";
const PASS_KEY = "cw_visitor_pass";

// Visitor is public; Admin is separated below a divider.
const ROLES = [
  {
    key: "visitor",
    title: "Visitor",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXeX8kVuuu85gl9xLMo6E5RNOQXuPmGZmEbq7OG11nX6oALVAch9-6zzBMmiXox4CyUdqE1JhKKMPF5IV62ovtnE-RALNR2sbOOl6EsZ98sg5b66gzCC5alVYiM7OhT1AMsfCS15ck4kWL98pW0SPZUQNXM_13ABUyNJHRIJ7qLEwoh0S_cjumfwvJdTgiSrjjZGe14kR3l57KWVRZHPZIce-V4XItmW-9jhRHWbieTZj24nUqhhieLMC5Dz3qAhef1A",
    alt: "Cat illustration",
  },
  {
    key: "admin",
    title: "Admin",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXZfsEEtLp0Y2g-OChKS9Aa76sYVykye6CA0_jm1xlGAs-kMl-O70Kz74RINCSzqbrP0Xi0tn6evdt8uabFST3mpj53oZ2ai7PcSCFRAnS5_X4BMiq3SD1zTL7AeYU00Cku-zzDXxXesYDOZ5zo2CabyZ19lJVgwz27wkEROw2NxwCNFrJzgEHlVw0o9G4TxViSwEi9bpkAntuVa6CHMcksXN5AhaGApxpajdm_ftaltyKhYFf3Xap5xFa2JnyTDWF8A",
    alt: "Rodent illustration",
  },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState("visitor"); // visitor selected by default
  const [shared, setShared] = useState(false);

  function pick(key) {
    setSelected(key);
  }

  async function shareApp() {
    const url = window.location.origin;
    const data = { title: "Coworking Rooms", text: "Live study-room availability", url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch (e) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch (e) {}
  }

  function next() {
    if (!selected) return;
    if (selected === "admin") {
      router.push("/admin");
      return;
    }
    try {
      // Guest skips the check-in; Visitor always sees the check-in page
      // (clear any skip flag left over from a previous Guest session).
      if (selected === "guest") localStorage.setItem(PASS_KEY, "1");
      else localStorage.removeItem(PASS_KEY);
    } catch (e) {}
    router.push("/visitor");
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

      <main className="flex-grow p-5 flex flex-col max-w-md mx-auto w-full">
        <section className="mt-6 mb-6 text-center">
          <h2 className="text-[26px] leading-8 font-bold text-on-surface mb-2 tracking-tight">
            Coworking Rooms
          </h2>
          <p className="text-on-surface-variant text-base">Choose how you want to continue</p>
        </section>

        {/* Selection cards */}
        <div className="flex gap-3 mb-8 flex-col">
          {ROLES.map((r) => {
            const active = selected === r.key;
            return (
              <Fragment key={r.key}>
                {r.key === "admin" && (
                  <div className="flex items-center gap-3 my-1" aria-hidden="true">
                    <span className="h-px flex-1 bg-outline-variant/60" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
                      Staff
                    </span>
                    <span className="h-px flex-1 bg-outline-variant/60" />
                  </div>
                )}
                <button
                  onClick={() => pick(r.key)}
                  onDoubleClick={next}
                  className={`w-full bg-surface-container-lowest rounded-xl p-3 shadow-sm border-2 border-solid text-left hover:shadow-md transition-all flex flex-row items-center gap-3 ${
                    active ? "" : "border-transparent hover:border-surface-variant"
                  }`}
                  style={active ? { borderColor: GREEN } : undefined}
                >
                  <img alt={r.alt} className="w-16 h-16 object-cover rounded-lg" src={r.img} />
                  <h3 className="text-lg font-semibold text-on-surface">{r.title}</h3>
                  <span
                    className={`material-symbols-outlined ml-auto ${
                      active ? "" : "text-on-surface-variant"
                    }`}
                    style={active ? { color: GREEN } : undefined}
                  >
                    {active ? "door_open" : "door_front"}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>

        {/* Next */}
        <div className="pb-4 flex justify-end">
          <button
            onClick={next}
            disabled={!selected}
            className="text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: GREEN }}
          >
            Next
          </button>
        </div>

        {/* Install / Download guide / Share — one row */}
        <div className="mt-auto mb-6 flex flex-wrap items-center justify-center gap-2">
          <InstallButton inline />
          <a
            href="/coworking-rooms-guide.pdf"
            download
            className="flex items-center gap-1.5 text-sm font-semibold text-secondary border-2 border-solid border-secondary rounded-full px-4 py-2.5 hover:bg-secondary hover:text-on-secondary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined !text-[18px]">download</span>
            Download guide
          </a>
          <button
            onClick={shareApp}
            className="flex items-center gap-1.5 text-sm font-semibold text-secondary border-2 border-solid border-secondary rounded-full px-4 py-2.5 hover:bg-secondary hover:text-on-secondary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined !text-[18px]">
              {shared ? "check" : "share"}
            </span>
            {shared ? "Link copied" : "Share app"}
          </button>
        </div>
      </main>
    </div>
  );
}
