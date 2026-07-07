"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Day-based keys: Reserved = reserved today (red), Not booked = reserved on a
// future day (orange), Free = no reservations (green).
const STATUS = {
  free: {
    tint: "rgba(34, 197, 94, 0.22)",
    label: "Free",
    chip: "bg-secondary-container text-on-secondary-container",
    dot: "#22c55e",
  },
  upcoming: {
    tint: "rgba(245, 158, 11, 0.26)",
    label: "Not booked",
    chip: "bg-[#FEF3C7] text-[#92400E]",
    dot: "#f59e0b",
  },
  booked: {
    tint: "rgba(239, 68, 68, 0.26)",
    label: "Reserved",
    chip: "bg-error-container text-on-error-container",
    dot: "#ef4444",
  },
};

// Interior regions of the two study rooms inside /floor-plan.svg
// (viewBox 690x780), as percentages so the overlays scale with the image.
const VB = { w: 690, h: 780 };
const pct = (v, total) => `${(v / total) * 100}%`;
const LIVE = {
  B: { left: pct(172, VB.w), top: pct(102, VB.h), width: pct(346, VB.w), height: pct(116, VB.h) },
  A: { left: pct(172, VB.w), top: pct(612, VB.h), width: pct(346, VB.w), height: pct(120, VB.h) },
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const LEGEND_KEYS = { free: "legendFree", upcoming: "legendUpcoming", booked: "legendReserved" };

export default function FloorMap({ rooms, onSelect, t: tr }) {
  const t = tr || ((k) => k);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const wrapRef = useRef(null);
  const planRef = useRef(null);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const isFs = nativeFs || cssFs;

  useEffect(() => {
    const onChange = () => setNativeFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (isFs) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setCssFs(false);
      return;
    }
    const el = planRef.current;
    // iOS Safari has no element fullscreen — fall back to a fixed overlay.
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => setCssFs(true));
    else setCssFs(true);
  }
  // Gesture state: active pointers, whether the gesture moved (to suppress
  // accidental room-taps after a pan), and last pinch distance.
  const g = useRef({ pointers: new Map(), moved: false, lastDist: 0 });

  const byRoom = Object.fromEntries((rooms || []).map((r) => [r.room, r]));

  const clampT = useCallback((s, x, y) => {
    const el = wrapRef.current;
    s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
    if (!el || s === 1) return { s, x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const minX = r.width * (1 - s);
    const minY = r.height * (1 - s);
    return {
      s,
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  }, []);

  // Zoom keeping the container point (px, py) fixed.
  const zoomAt = useCallback(
    (px, py, factor) => {
      setView((prev) => {
        const s2 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.s * factor));
        const k = s2 / prev.s;
        return clampT(s2, px - (px - prev.x) * k, py - (py - prev.y) * k);
      });
    },
    [clampT]
  );

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function onPointerDown(e) {
    wrapRef.current?.setPointerCapture(e.pointerId);
    g.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    g.current.moved = false;
    if (g.current.pointers.size === 2) {
      const [a, b] = [...g.current.pointers.values()];
      g.current.lastDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function onPointerMove(e) {
    const p = g.current.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.hypot(dx, dy) > 4) g.current.moved = true;
    p.x = e.clientX;
    p.y = e.clientY;

    if (g.current.pointers.size === 1) {
      setView((prev) => clampT(prev.s, prev.x + dx, prev.y + dy));
    } else if (g.current.pointers.size === 2) {
      const [a, b] = [...g.current.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = wrapRef.current.getBoundingClientRect();
      const mx = (a.x + b.x) / 2 - r.left;
      const my = (a.y + b.y) / 2 - r.top;
      if (g.current.lastDist > 0) zoomAt(mx, my, dist / g.current.lastDist);
      g.current.lastDist = dist;
    }
  }

  function onPointerUp(e) {
    g.current.pointers.delete(e.pointerId);
    g.current.lastDist = 0;
  }

  function zoomCenter(factor) {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, factor);
  }

  const btn = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid #c6c6cd",
    background: "#ffffff",
    color: "#0b1c30",
    fontSize: 16,
    fontWeight: 700,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
    cursor: "pointer",
  };

  return (
    <div>
      <div
        ref={planRef}
        className="relative overflow-hidden bg-white rounded-2xl ambient-shadow border border-solid border-outline-variant/50 p-2"
        style={
          isFs
            ? {
                ...(cssFs
                  ? { position: "fixed", inset: 0, zIndex: 70, borderRadius: 0 }
                  : {}),
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }
            : undefined
        }
      >
        {/* Gesture surface: pan / pinch / wheel apply only inside the plan */}
        <div
          ref={wrapRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "relative",
            touchAction: "none",
            userSelect: "none",
            cursor: view.s > 1 ? "grab" : "default",
            // In fullscreen, fit the whole plan on screen and center it.
            width: isFs ? "min(100%, calc(92vh * 0.885))" : "100%",
            margin: isFs ? "0 auto" : undefined,
          }}
        >
          <div
            style={{
              position: "relative",
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
              transformOrigin: "0 0",
            }}
          >
            {/* The exact floor-plan SVG, untouched */}
            <img
              src="/floor-plan.svg"
              alt="Coworking space floor plan"
              draggable={false}
              style={{ width: "100%", height: "auto", display: "block" }}
            />

            {/* Live status tints + tap targets over Study rooms A and B */}
            {["B", "A"].map((k) => {
              const st = STATUS[byRoom[k]?.status || "free"];
              return (
                <div
                  key={k}
                  onClick={() => {
                    if (!g.current.moved) onSelect?.(k);
                  }}
                  role="button"
                  aria-label={`Study room ${k}: ${st.label}`}
                  style={{
                    position: "absolute",
                    ...LIVE[k],
                    background: st.tint,
                    mixBlendMode: "multiply",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 2,
          }}
        >
          <button style={btn} aria-label="Zoom in" onClick={() => zoomCenter(1.3)}>
            +
          </button>
          <button style={btn} aria-label="Zoom out" onClick={() => zoomCenter(1 / 1.3)}>
            −
          </button>
          <button
            style={{ ...btn, fontSize: 13 }}
            aria-label="Reset zoom"
            onClick={() => setView({ s: 1, x: 0, y: 0 })}
          >
            ⟲
          </button>
          <button
            style={{ ...btn, fontSize: 14 }}
            aria-label={isFs ? "Exit fullscreen" : "Fullscreen"}
            onClick={toggleFullscreen}
          >
            {isFs ? "✕" : "⛶"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-on-surface-variant">
        {["free", "upcoming", "booked"].map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <i
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: STATUS[k].dot }}
            />
            {t(LEGEND_KEYS[k])}
          </span>
        ))}
        <span className="ml-auto text-xs">{t("mapHint")}</span>
      </div>
    </div>
  );
}
