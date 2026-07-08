"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

function Icon({ name, size, className = "" }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={size ? { fontSize: size } : undefined}>
      {name}
    </span>
  );
}

/* ---- date helpers (native, Monday-first) ---- */
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); };
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROOM = {
  A: { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3", dot: "#6366f1" },
  B: { bg: "#ccfbf1", border: "#0d9488", text: "#115e59", dot: "#0d9488" },
};
const VISITOR = { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", dot: "#f59e0b" };

const DAY_START = 7;
const DAY_END = 22;
const HOUR_PX = 48;

export default function Calendar() {
  const [view, setView] = useState("month");
  const [source, setSource] = useState("bookings"); // "bookings" | "visitors"
  const [cursor, setCursor] = useState(() => new Date());
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);

  const range = useMemo(() => {
    if (view === "month") {
      const from = startOfWeek(startOfMonth(cursor));
      return { from, to: addDays(from, 42) };
    }
    if (view === "week") {
      const from = startOfWeek(cursor);
      return { from, to: addDays(from, 7) };
    }
    const from = startOfDay(cursor);
    return { from, to: addDays(from, 1) };
  }, [view, cursor]);

  const load = useCallback(async () => {
    const qs = `from=${range.from.toISOString()}&to=${range.to.toISOString()}`;
    try {
      if (source === "visitors") {
        const res = await fetch(`/api/visitors?${qs}`, { cache: "no-store" });
        const data = await res.json();
        setItems(
          (data.visitors || []).map((v) => {
            const start = new Date(v.at);
            return { id: v.id, kind: "visitor", title: v.name, phone: v.phone, start, end: new Date(start.getTime() + 30 * 60000), color: VISITOR };
          })
        );
      } else {
        const res = await fetch(`/api/events?${qs}`, { cache: "no-store" });
        const data = await res.json();
        setItems(
          (data.events || []).map((e) => ({ id: e.id, kind: "booking", room: e.room, title: e.title, start: new Date(e.start), end: new Date(e.end), color: ROOM[e.room] }))
        );
      }
    } catch (e) {}
  }, [range.from, range.to, source]);

  useEffect(() => { load(); }, [load]);

  function move(dir) {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else setCursor(addDays(cursor, dir * (view === "week" ? 7 : 1)));
  }

  const label =
    view === "day"
      ? cursor.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
      : view === "week"
      ? `${startOfWeek(cursor).toLocaleDateString([], { month: "short", day: "numeric" })} – ${addDays(startOfWeek(cursor), 6).toLocaleDateString([], { month: "short", day: "numeric" })}`
      : cursor.toLocaleDateString([], { month: "long", year: "numeric" });

  const seg = (on) =>
    `px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
      on ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-variant"
    }`;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight">Calendar</h2>
        <p className="text-base text-on-surface-variant">
          {source === "visitors" ? "Visitor check-ins over time." : "Bookings across both study rooms."}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant active:scale-95">
            <Icon name="chevron_left" />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-solid border-outline-variant text-on-surface-variant hover:bg-surface-variant">
            Today
          </button>
          <button onClick={() => move(1)} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant active:scale-95">
            <Icon name="chevron_right" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-primary">{label}</h3>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Data-source switcher */}
          <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-solid border-outline-variant/60">
            <button onClick={() => setSource("bookings")} className={seg(source === "bookings")}>
              Bookings
            </button>
            <button onClick={() => setSource("visitors")} className={seg(source === "visitors")}>
              Visitors
            </button>
          </div>
          {/* View switcher */}
          <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-solid border-outline-variant/60">
            <button onClick={() => setView("month")} className={seg(view === "month")}>Month</button>
            <button onClick={() => setView("week")} className={seg(view === "week")}>Week</button>
            <button onClick={() => setView("day")} className={seg(view === "day")}>Day</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-sm text-on-surface-variant">
        {source === "visitors" ? (
          <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: VISITOR.dot }} /> Check-ins</span>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: ROOM.A.dot }} /> Study Room A</span>
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: ROOM.B.dot }} /> Study Room B</span>
          </>
        )}
      </div>

      {view === "month" && <MonthView cursor={cursor} items={items} onPick={setSel} />}
      {view !== "month" && (
        <TimeGrid days={view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)) : [startOfDay(cursor)]} items={items} onPick={setSel} />
      )}

      {sel && <ItemDetail e={sel} onClose={() => setSel(null)} />}
    </>
  );
}

/* ---- Month grid ---- */
function MonthView({ cursor, items, onPick }) {
  const first = startOfWeek(startOfMonth(cursor));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const today = new Date();

  return (
    <div className="bg-surface-container-lowest rounded-2xl ambient-shadow border border-solid border-outline-variant/40 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-solid border-outline-variant/40">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = sameDay(day, today);
          const dayItems = items.filter((e) => e.start < addDays(day, 1) && e.end > day).sort((a, b) => a.start - b.start);
          return (
            <div key={i} className={`min-h-[92px] border-b border-r border-solid border-outline-variant/30 p-1.5 ${inMonth ? "" : "bg-surface-container-low/40"}`}>
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-on-primary" : inMonth ? "text-on-surface" : "text-outline"}`}>
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {dayItems.slice(0, 3).map((e) => (
                  <button key={e.id} onClick={() => onPick(e)} className="w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md truncate" style={{ background: e.color.bg, color: e.color.text }}>
                    <span className="font-semibold">{fmtTime(e.start)}</span> {e.title}
                  </button>
                ))}
                {dayItems.length > 3 && <span className="text-[10px] text-on-surface-variant pl-1">+{dayItems.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Week / Day time grid ---- */
function TimeGrid({ days, items, onPick }) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const today = new Date();

  return (
    <div className="bg-surface-container-lowest rounded-2xl ambient-shadow border border-solid border-outline-variant/40 overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid border-b border-solid border-outline-variant/40" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          <div />
          {days.map((d, i) => (
            <div key={i} className="px-2 py-2 text-center border-l border-solid border-outline-variant/30">
              <div className="text-xs font-semibold uppercase text-on-surface-variant">{WEEKDAYS[(d.getDay() + 6) % 7]}</div>
              <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${sameDay(d, today) ? "bg-primary text-on-primary" : "text-on-surface"}`}>{d.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          <div>
            {hours.map((h) => (
              <div key={h} className="h-12 text-[11px] text-on-surface-variant text-right pr-2 -mt-2">{h}:00</div>
            ))}
          </div>
          {days.map((day, di) => {
            const dayItems = items.filter((e) => sameDay(e.start, day) || (e.start < day && e.end > day));
            return (
              <div key={di} className="relative border-l border-solid border-outline-variant/30" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((h) => <div key={h} className="border-b border-solid border-outline-variant/20" style={{ height: HOUR_PX }} />)}
                {dayItems.map((e) => {
                  const s = Math.max(DAY_START, e.start.getHours() + e.start.getMinutes() / 60);
                  const en = Math.min(DAY_END, e.end.getHours() + e.end.getMinutes() / 60 || DAY_END);
                  const top = (s - DAY_START) * HOUR_PX;
                  const height = Math.max(20, (en - s) * HOUR_PX - 2);
                  return (
                    <button key={e.id} onClick={() => onPick(e)} className="absolute left-1 right-1 rounded-md px-1.5 py-1 text-left overflow-hidden" style={{ top, height, background: e.color.bg, borderLeft: `3px solid ${e.color.border}`, color: e.color.text }}>
                      <div className="text-[11px] font-semibold leading-tight truncate">{e.title}</div>
                      <div className="text-[10px] leading-tight opacity-80">{e.kind === "visitor" ? `checked in ${fmtTime(e.start)}` : `${fmtTime(e.start)}–${fmtTime(e.end)}`}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- detail sheet ---- */
function ItemDetail({ e, onClose }) {
  const visitor = e.kind === "visitor";
  return (
    <div className="fixed inset-0 z-[60] bg-on-background/40 flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full md:max-w-md rounded-t-2xl md:rounded-2xl ambient-shadow p-6" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-1 rounded-full" style={{ background: e.color.bg, color: e.color.text }}>
            {visitor ? "Check-in" : `Study Room ${e.room}`}
          </span>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant rounded-full p-2 active:scale-95"><Icon name="close" /></button>
        </div>
        <h3 className="text-xl font-bold text-primary">{e.title}</h3>
        {visitor && e.phone && (
          <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1.5"><Icon name="call" size={16} />{e.phone}</p>
        )}
        <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1.5">
          <Icon name="schedule" size={16} />
          {new Date(e.start).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          {visitor ? "" : ` – ${fmtTime(e.end)}`}
        </p>
      </div>
    </div>
  );
}
