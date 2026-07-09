"use client";

import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  registerSW,
  enableNotifications,
  pushSupported,
} from "@/lib/pushClient";
import { STRINGS } from "@/lib/visitorI18n";
import FloorMap from "./FloorMap";
import InstallButton from "../InstallButton";

const PASS_KEY = "cw_visitor_pass";
const LANG_KEY = "cw_lang";

/* ---------------- i18n ---------------- */
const I18nCtx = createContext({ lang: "en", setLang: () => {}, t: (k) => k });
const useI18n = () => useContext(I18nCtx);

// Inline SVG flags (emoji flags don't render on Windows/some browsers).
function Flag({ code }) {
  const cls = "w-[18px] h-[12px] rounded-[2px] shrink-0";
  if (code === "fr") {
    return (
      <svg viewBox="0 0 3 2" className={cls} aria-hidden="true">
        <rect width="1" height="2" x="0" fill="#0055A4" />
        <rect width="1" height="2" x="1" fill="#ffffff" />
        <rect width="1" height="2" x="2" fill="#EF4135" />
      </svg>
    );
  }
  // United Kingdom
  return (
    <svg viewBox="0 0 60 30" className={cls} aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      <rect x="25" width="10" height="30" fill="#ffffff" />
      <rect y="10" width="60" height="10" fill="#ffffff" />
      <rect x="27" width="6" height="30" fill="#C8102E" />
      <rect y="12" width="60" height="6" fill="#C8102E" />
    </svg>
  );
}

function LangSwitch({ className = "" }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={`inline-flex items-stretch h-10 rounded-lg border border-solid border-outline-variant overflow-hidden text-xs font-semibold ${className}`}
    >
      {["en", "fr"].map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 flex items-center gap-1.5 uppercase transition-colors ${
            lang === l
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant"
          }`}
        >
          <Flag code={l} />
          {l}
        </button>
      ))}
    </div>
  );
}

function fmt(d) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtWhen(d) {
  return new Date(d).toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default function Visitor() {
  const [ready, setReady] = useState(false);
  const [passed, setPassed] = useState(false);
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      setPassed(localStorage.getItem(PASS_KEY) === "1");
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "fr" || saved === "en") setLangState(saved);
    } catch (e) {}
    setReady(true);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch (e) {}
  }, []);

  const t = useCallback(
    (key, vars) => {
      let s = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
      if (vars) {
        for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, vars[k]);
      }
      return s;
    },
    [lang]
  );

  function pass() {
    try {
      localStorage.setItem(PASS_KEY, "1");
    } catch (e) {}
    setPassed(true);
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <I18nCtx.Provider value={{ lang, setLang, t }}>
      {!passed ? <Gate onDone={pass} /> : <Board />}
      <InstallButton />
    </I18nCtx.Provider>
  );
}

/* ---------------- Check-in gate ---------------- */
function Gate({ onDone }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setErr(t("errName"));
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await fetch("/api/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
    } catch (e) {}
    setBusy(false);
    onDone();
  }

  const field =
    "w-full rounded-lg bg-surface-container-low text-on-surface border border-solid border-outline-variant px-4 py-3 outline-none focus:border-secondary";

  return (
    <div className="relative min-h-screen bg-background text-on-background font-sans flex items-center justify-center px-5">
      <a
        href="/"
        aria-label="Back"
        className="absolute top-4 left-4 text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95 transition-colors"
      >
        <Icon name="arrow_back" />
      </a>
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-solid border-outline-variant/60 shadow-sm p-6 md:p-8"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="waving_hand" filled />
          </div>
          <LangSwitch />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-1">{t("gateTitle")}</h1>
        <p className="text-sm text-on-surface-variant mb-6">{t("gateDesc")}</p>

        <label className="block text-xs font-semibold tracking-wider uppercase text-on-surface-variant mb-1.5">
          {t("name")}
        </label>
        <input
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePh")}
        />

        <label className="block text-xs font-semibold tracking-wider uppercase text-on-surface-variant mb-1.5 mt-4">
          {t("phone")}
        </label>
        <input
          className={field}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+216 …"
          inputMode="tel"
        />

        {err && <p className="text-sm text-error mt-3">{err}</p>}

        <div className="mt-6">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-on-primary rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {busy ? t("checking") : t("checkInBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Board ---------------- */
const NAV = [
  { key: "list", label: "navRooms", icon: "event_available" },
  { key: "map", label: "navMap", icon: "map" },
  { key: "alerts", label: "navAlerts", icon: "notifications" },
  { key: "home", label: "navExit", icon: "logout" },
];

function Board() {
  const { t } = useI18n();
  const [rooms, setRooms] = useState([]);
  const [permission, setPermission] = useState("default");
  const [supported, setSupported] = useState(true);
  const [view, setView] = useState("list");
  const [schedRoom, setSchedRoom] = useState(null);
  const [schedule, setSchedule] = useState(null);

  async function openSchedule(room) {
    setSchedRoom(room);
    setSchedule(null);
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = await res.json();
      setSchedule((data.events || []).filter((e) => e.room === room));
    } catch (e) {
      setSchedule([]);
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    setSupported(pushSupported());
    if (pushSupported()) {
      registerSW();
      setPermission(Notification.permission);
    }
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);

  const onEnable = useCallback(async () => {
    const result = await enableNotifications();
    if (result === "unsupported") setSupported(false);
    else setPermission(result);
  }, []);

  function nav(key) {
    if (key === "home") window.location.href = "/";
    else setView(key);
  }

  const activeKey = view;

  return (
    <div className="min-h-screen bg-background text-on-background font-sans flex flex-col md:flex-row">
      {/* Sidebar (web) */}
      <header className="hidden md:flex flex-col w-64 bg-surface-container-low border-r border-solid border-outline-variant h-screen fixed left-0 top-0 z-40">
        <div className="px-6 py-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">{t("appTitle")}</h1>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 py-4">
          {NAV.map((n) => {
            const active = n.key === activeKey;
            return (
              <button
                key={n.key}
                onClick={() => nav(n.key)}
                className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-left ${
                  active
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <Icon name={n.icon} filled={active} />
                <span className="text-base">{t(n.label)}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-6 pb-6">
          <LangSwitch />
        </div>
      </header>

      {/* Top bar (mobile) */}
      <header className="w-full top-0 sticky bg-surface border-b border-solid border-outline-variant md:hidden z-40">
        <div className="flex justify-between items-center px-4 py-4 w-full">
          <a href="/" className="text-on-surface-variant p-2 rounded-lg active:scale-95">
            <Icon name="arrow_back" />
          </a>
          <div className="flex items-center gap-[5px]">
            <LangSwitch />
            <button
              onClick={() => setView("alerts")}
              className="text-on-surface-variant p-2 rounded-lg active:scale-95"
            >
              <Icon name="notifications" filled={permission === "granted"} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 px-2.5 md:px-8 py-8 w-full max-w-5xl mx-auto">
        <header className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight">
            {view === "map" ? t("mapTitle") : view === "alerts" ? t("alertsTitle") : t("roomsTitle")}
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant">
            {view === "map" ? t("mapDesc") : view === "alerts" ? t("alertsDesc") : t("roomsDesc")}
          </p>
        </header>

        {supported && permission !== "granted" && view !== "map" && (
          <button
            onClick={onEnable}
            className="w-full mb-6 flex items-center justify-between gap-3 bg-secondary-container text-on-secondary-container rounded-xl px-4 py-3 text-left"
          >
            <span className="flex items-center gap-3">
              <Icon name="notifications_active" filled />
              <span className="text-sm font-medium">{t("bannerEnable")}</span>
            </span>
            <Icon name="chevron_right" />
          </button>
        )}

        {view === "map" ? (
          <FloorMap rooms={rooms} onSelect={openSchedule} t={t} />
        ) : view === "alerts" ? (
          <AlertsView />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {rooms.map((r) => (
              <RoomCard key={r.room} r={r} onSchedule={openSchedule} />
            ))}
          </div>
        )}

        {schedRoom && (
          <ScheduleModal
            room={schedRoom}
            events={schedule}
            onClose={() => setSchedRoom(null)}
          />
        )}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-solid border-outline-variant flex justify-around items-center px-4 py-2">
        {NAV.map((n) => {
          const active = n.key === activeKey;
          return (
            <button
              key={n.key}
              onClick={() => nav(n.key)}
              style={{ padding: "5px", background: "none" }}
              className={`flex flex-col items-center justify-center active:scale-90 transition-colors ${
                active ? "text-on-secondary-container" : "text-on-surface-variant"
              }`}
            >
              <Icon name={n.icon} filled={active} />
              <span className="text-[11px] font-semibold mt-1">{t(n.label)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------- Room card ---------------- */

function hoursUntil(d, t) {
  const h = (new Date(d).getTime() - Date.now()) / 3600000;
  if (h >= 1) return t("upToHrs", { v: Math.round(h * 2) / 2 });
  return t("upToMin", { v: Math.max(5, Math.round((h * 60) / 5) * 5) });
}

function RoomCard({ r, onSchedule }) {
  const { t } = useI18n();
  const occupied = !!r.event; // an event is in progress right now
  const reserved = r.status === "booked"; // has a reservation today
  const upcoming = r.status === "upcoming"; // reserved on a future day

  const headGrad = reserved
    ? "from-[#3a1116] to-primary-container"
    : "from-primary-container to-[#0f3b36]";

  return (
    <article className="bg-surface-container-lowest rounded-xl overflow-hidden border border-solid border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* header */}
      <div className={`relative h-32 md:h-48 w-full bg-gradient-to-br ${headGrad} flex items-center justify-center`}>
        <Icon name="meeting_room" className="!text-[64px] md:!text-[96px] text-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-on-background/90 via-on-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-base md:text-xl font-semibold text-white leading-tight">
            {t("studyRoom")} {r.room}
          </h3>
        </div>
      </div>

      {/* body */}
      <div className="p-3 md:p-5 flex flex-col gap-3 flex-1 justify-between">
        <div>
          <div className="flex flex-col gap-1 mb-3">
            {/* status row — fixed height */}
            <div className="flex items-center gap-2 h-4 md:h-5">
              <div
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0 ${
                  occupied
                    ? "bg-error animate-pulse"
                    : reserved
                    ? "bg-error"
                    : upcoming
                    ? "bg-[#f59e0b]"
                    : "bg-secondary"
                }`}
              />
              <span
                className={`text-[10px] md:text-xs font-semibold tracking-wider whitespace-nowrap truncate ${
                  reserved ? "text-error" : upcoming ? "text-[#b45309]" : "text-secondary"
                }`}
              >
                {occupied
                  ? t("occupied")
                  : reserved
                  ? t("reservedToday")
                  : upcoming
                  ? t("bookedFuture")
                  : t("free")}
              </span>
            </div>
            {/* time line — fixed height */}
            <span className="text-xs text-primary font-semibold h-4 md:h-5 flex items-center whitespace-nowrap truncate">
              {occupied
                ? `${t("until")} ${fmt(r.event.end)}`
                : r.next
                ? `${t("next")}: ${reserved ? fmt(r.next.start) : fmtWhen(r.next.start)}`
                : t("readyNow")}
            </span>
          </div>

          {/* info box — fixed height */}
          {occupied ? (
            <div className="bg-surface-container-low p-2.5 md:p-4 rounded-lg border border-solid border-outline-variant/30 h-[72px] md:h-[92px] overflow-hidden">
              <p className="text-[10px] md:text-xs font-semibold tracking-wider text-on-surface-variant mb-1">
                {t("currentEvent")}
              </p>
              <p className="text-xs md:text-base text-primary font-medium leading-snug line-clamp-2">
                {r.event.title}
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-low p-2.5 md:p-4 rounded-lg border border-solid border-outline-variant/30 h-[72px] md:h-[92px] overflow-hidden flex items-center gap-2 md:gap-3">
              <Icon name="check_circle" filled className="text-secondary !text-lg md:!text-2xl shrink-0" />
              <div className="min-w-0">
                <p className="text-xs md:text-base text-primary font-medium leading-tight">
                  {t("readyNow")}
                </p>
                <p className="text-[11px] md:text-sm text-on-surface-variant truncate">
                  {r.next ? hoursUntil(r.next.start, t) : t("noBookingsAhead")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* button — fixed height */}
        <button
          onClick={() => onSchedule(r.room)}
          className="w-full mt-1 h-9 md:h-12 rounded-lg text-xs md:text-base font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 md:gap-2"
        >
          <Icon name="schedule" className="!text-[15px] md:!text-[18px]" />
          {t("busyTimes")}
        </button>
      </div>
    </article>
  );
}

/* ---------------- Alerts screen ---------------- */
function AlertsView() {
  const { t } = useI18n();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/alerts", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ reminders: [], alerts: [] }));
  }, []);

  if (!data) {
    return <p className="text-sm text-on-surface-variant py-8 text-center">{t("loading")}</p>;
  }

  const now = new Date();
  const isToday = (d) => new Date(d).toDateString() === now.toDateString();
  const today = data.reminders.filter((r) => isToday(r.start) || new Date(r.start) < now);
  const tomorrow = data.reminders.filter((r) => !today.includes(r));
  const isNew = (at) => now - new Date(at) < 24 * 3600 * 1000;

  const caps = "text-xs font-semibold tracking-wider uppercase text-on-surface-variant mb-2";

  function ReminderRow({ r }) {
    const live = new Date(r.start) <= now;
    return (
      <div className="bg-surface-container-lowest rounded-lg px-3 py-2 flex items-center gap-2.5 border border-solid border-outline-variant/30">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
            live
              ? "bg-error-container text-on-error-container"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <Icon name={live ? "meeting_room" : "alarm"} size={15} filled={live} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-primary">
              {fmt(r.start)} – {fmt(r.end)}
            </p>
            <p className="text-[10px] font-semibold tracking-wide uppercase text-on-surface-variant shrink-0">
              {live ? t("inProgress") : `${t("studyRoom")} ${r.room}`}
            </p>
          </div>
          <p className="text-xs text-on-surface-variant truncate">
            {live ? `${t("studyRoom")} ${r.room} · ` : ""}
            {r.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className={caps}>{t("today")}</p>
        {today.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t("noRemToday")}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {today.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <p className={caps}>{t("tomorrow")}</p>
        {tomorrow.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t("noRemTomorrow")}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tomorrow.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <p className={caps}>{t("recentAlerts")}</p>
        {data.alerts.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t("noAlerts")}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {data.alerts.map((a) => {
              const booked = a.type === "booked";
              return (
                <div
                  key={a.id}
                  className="bg-surface-container-lowest rounded-lg px-3 py-2 flex items-center gap-2.5 border border-solid border-outline-variant/30"
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      booked
                        ? "bg-error-container text-on-error-container"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    <Icon name={booked ? "event_busy" : "event_available"} size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-primary truncate">
                        {t("studyRoom")} {a.room} {booked ? t("isBooked") : t("isFree")}
                        {booked ? ` — ${a.title}` : ""}
                      </p>
                      {isNew(a.at) && (
                        <span className="text-[9px] font-bold tracking-wider uppercase bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full shrink-0">
                          {t("newBadge")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(a.at).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------- Busy times modal ---------------- */
function ScheduleModal({ room, events, onClose }) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-[60] bg-on-background/40 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full md:max-w-md rounded-t-2xl md:rounded-2xl ambient-shadow p-6 pb-10 md:pb-6 max-h-[85vh] md:max-h-[80vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-bold text-primary">
            {t("studyRoom")} {room}
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-variant rounded-full p-2 active:scale-95"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="text-sm text-on-surface-variant mb-5">{t("modalDesc")}</p>

        {events === null && (
          <p className="text-sm text-on-surface-variant py-6 text-center">{t("loading")}</p>
        )}

        {events && events.length === 0 && (
          <div className="bg-surface-container-low rounded-xl p-6 text-center">
            <Icon name="event_available" size={36} className="text-secondary mb-1" />
            <p className="text-base font-medium text-primary">{t("noBookingsAhead")}</p>
            <p className="text-sm text-on-surface-variant">{t("freeAllDay")}</p>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {events.map((e) => {
              const live = new Date(e.start) <= new Date();
              return (
                <div
                  key={e.id}
                  className="bg-surface-container-low rounded-lg px-3 py-2 flex items-center gap-2.5 border border-solid border-outline-variant/30"
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      live
                        ? "bg-error-container text-on-error-container"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    <Icon name={live ? "meeting_room" : "schedule"} size={15} filled={live} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-primary">
                        {fmt(e.start)} – {fmt(e.end)}
                      </p>
                      <p className="text-[10px] font-semibold tracking-wide uppercase text-on-surface-variant shrink-0">
                        {live
                          ? t("inProgress")
                          : new Date(e.start).toLocaleDateString([], {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                      </p>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{e.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
