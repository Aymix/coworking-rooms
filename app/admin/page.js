"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import InstallButton from "../InstallButton";
import Logo from "../Logo";
import SupportButton from "../SupportButton";
import { setLogo, useLogo } from "@/lib/logoClient";
import Calendar from "./Calendar";

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

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.admin);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) return <div className="min-h-screen bg-background" />;
  return (
    <>
      {authed ? (
        <Dashboard onLogout={() => setAuthed(false)} />
      ) : (
        <Login onLogin={() => setAuthed(true)} />
      )}
      <InstallButton />
    </>
  );
}

/* ---------------- Login ---------------- */
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (res.ok) onLogin();
    else setErr("Invalid username or password.");
  }

  const field =
    "w-full bg-surface-container-lowest border border-solid border-outline-variant rounded-xl px-4 py-3 text-base text-primary focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none placeholder:text-outline";

  return (
    <div className="relative min-h-screen bg-background text-on-surface font-sans flex items-center justify-center px-5">
      <div className="absolute top-4 left-4 flex items-center gap-1">
        <a
          href="/"
          aria-label="Back"
          className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95 transition-colors"
        >
          <Icon name="arrow_back" />
        </a>
      </div>
      <div className="absolute top-4 right-4">
        <SupportButton nav />
      </div>
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl ambient-shadow p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <Logo size={32} />
          <h1 className="text-xl font-bold text-primary">CoWork Hub</h1>
        </div>

        <h2 className="text-2xl font-bold text-primary mb-1">Admin sign in</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Manage rooms and publish events to the community.
        </p>

        <label className="block text-xs font-semibold tracking-wider uppercase text-on-surface-variant mb-2">
          Username
        </label>
        <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />

        <label className="block text-xs font-semibold tracking-wider uppercase text-on-surface-variant mb-2 mt-4">
          Password
        </label>
        <input
          className={field}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {err && <p className="text-sm text-error mt-3">{err}</p>}

        <button
          disabled={busy}
          className="w-full mt-6 px-8 py-3 rounded-xl bg-primary text-on-primary text-xs font-semibold tracking-wider uppercase hover:bg-opacity-90 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Icon name="login" size={18} />
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-on-surface-variant mt-4 text-center">Demo: admin / demo1234</p>
      </form>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
const NAV = [
  { key: "schedule", label: "Schedule Event", icon: "calendar_today" },
  { key: "calendar", label: "Calendar", icon: "calendar_month" },
  { key: "bookings", label: "Bookings", icon: "bookmark" },
  { key: "visitors", label: "Visitors", icon: "groups" },
  { key: "settings", label: "Settings", icon: "settings" },
];

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("schedule");
  const [rooms, setRooms] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      setRooms((await res.json()).rooms || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  async function endEvent(id, room) {
    if (!confirm(`End the event in Study Room ${room} and mark it free?`)) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "ok", text: `Study Room ${room} freed — everyone notified.` });
      load();
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex">
      {/* SideNav (desktop) */}
      <nav className="hidden md:flex flex-col h-screen w-80 rounded-r-xl bg-surface-container-low shadow-lg py-6 sticky top-0 left-0 z-40">
        <div className="px-6 mb-8 flex items-center gap-3">
          <Logo size={32} />
          <h1 className="text-xl font-bold text-primary">CoWork Hub</h1>
        </div>
        <div className="px-6 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="admin_panel_settings" filled />
          </div>
          <div>
            <p className="text-base font-semibold text-primary">Demo Admin</p>
            <p className="text-sm text-on-surface-variant">Coworking Rooms</p>
          </div>
        </div>
        <ul className="flex-1 px-4 flex flex-col gap-2 list-none m-0">
          {NAV.map((n) => {
            const active = tab === n.key;
            return (
              <li key={n.key}>
                <button
                  onClick={() => setTab(n.key)}
                  className={`w-full flex items-center gap-3 rounded-full m-2 px-4 py-3 transition-all text-left ${
                    active
                      ? "bg-secondary-container text-on-secondary-container font-bold"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  <Icon name={n.icon} filled={active} />
                  <span className="text-base">{n.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="px-4 mt-auto flex flex-col">
          <div className="m-2">
            <SupportButton row />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant rounded-full m-2 px-4 py-3 transition-all text-left"
          >
            <Icon name="logout" />
            <span className="text-base">Log out</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* TopAppBar (mobile) */}
        <header className="md:hidden w-full top-0 sticky bg-surface border-b border-solid border-outline-variant shadow-sm z-50 flex justify-between items-center px-3 py-4">
          <div className="flex items-center gap-1">
            <a href="/" className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95">
              <Icon name="arrow_back" />
            </a>
            <Logo size={24} />
          </div>
          <h1 className="text-lg font-bold text-primary">CoWork Hub</h1>
          <div className="flex items-center gap-1">
            <SupportButton nav />
            <button onClick={logout} className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95">
              <Icon name="logout" />
            </button>
          </div>
        </header>

        {/* Slot for the Schedule action card — rendered here (main level) via portal */}
        <div id="admin-action-slot" />

        <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-4xl mx-auto w-full pb-32 md:pb-12">
          {msg && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 ${
                msg.type === "ok"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              <Icon
                name={msg.type === "ok" ? "check_circle" : "error"}
                size={18}
                className="shrink-0 mt-0.5"
              />
              <span className="min-w-0 break-words leading-snug">{msg.text}</span>
            </div>
          )}

          {tab === "schedule" && <ScheduleForm rooms={rooms} onDone={(m) => { setMsg(m); load(); }} />}
          {tab === "calendar" && <Calendar />}
          {tab === "bookings" && <Bookings rooms={rooms} onEnd={endEvent} />}
          {tab === "visitors" && <Visitors />}
          {tab === "settings" && <Settings onDone={setMsg} />}
        </div>
      </main>

      {/* BottomNavBar (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-solid border-outline-variant shadow-sm">
        {NAV.map((n) => {
          const active = tab === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              style={{ padding: "5px", background: "none" }}
              className={`flex flex-col items-center justify-center active:scale-90 transition-colors ${
                active ? "text-on-secondary-container" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Icon name={n.icon} filled={active} />
              <span className="text-[11px] font-semibold tracking-wide">{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------- Schedule Event form ---------------- */
function ScheduleForm({ rooms, onDone }) {
  const [room, setRoom] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionSlot, setActionSlot] = useState(null);
  const [mode, setMode] = useState("single"); // "single" | "range"
  const [endDate, setEndDate] = useState("");
  const [skipWeekends, setSkipWeekends] = useState(false);

  useEffect(() => {
    setActionSlot(document.getElementById("admin-action-slot"));
    const now = new Date();
    const p = (n) => String(n).padStart(2, "0");
    setDate(`${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`);
    setStartTime(`${p(now.getHours())}:${p(now.getMinutes())}`);
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setEndTime(`${p(later.getHours())}:${p(later.getMinutes())}`);
    const dstr = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    setEndDate(dstr);
  }, []);

  // Expand a date range into one {start,end} slot per day (optionally skipping weekends).
  function buildSlots() {
    const slots = [];
    const cur = new Date(`${date}T00:00`);
    const last = new Date(`${endDate}T00:00`);
    for (let i = 0; cur <= last && i < 400; i++, cur.setDate(cur.getDate() + 1)) {
      const wd = cur.getDay();
      if (skipWeekends && (wd === 0 || wd === 6)) continue;
      const p = (n) => String(n).padStart(2, "0");
      const d = `${cur.getFullYear()}-${p(cur.getMonth() + 1)}-${p(cur.getDate())}`;
      slots.push({
        start: new Date(`${d}T${startTime}`).toISOString(),
        end: new Date(`${d}T${endTime}`).toISOString(),
      });
    }
    return slots;
  }

  async function submit(e) {
    e.preventDefault();
    if (!room) {
      onDone({ type: "err", text: "Select a workspace first." });
      return;
    }
    setBusy(true);

    const isRange = mode === "range";
    const payload = isRange
      ? { room, title, description, slots: buildSlots() }
      : {
          room,
          title,
          description,
          start: new Date(`${date}T${startTime}`).toISOString(),
          end: new Date(`${date}T${endTime}`).toISOString(),
        };

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    const data = await res.json();

    if (res.ok || (isRange && data.created)) {
      setTitle("");
      setDescription("");
      if (isRange) {
        const skip = data.skipped?.length ? ` (${data.skipped.length} skipped for conflicts)` : "";
        onDone({ type: "ok", text: `Published ${data.created} session${data.created > 1 ? "s" : ""} to Study Room ${room}${skip} — everyone notified.` });
      } else {
        onDone({ type: "ok", text: `Published to Study Room ${room} — everyone notified.` });
      }
    } else {
      onDone({
        type: "err",
        text: isRange && data.created === 0
          ? "Every date clashed with an existing booking — nothing published."
          : data.error || "Failed to publish.",
      });
    }
  }

  const field =
    "w-full bg-surface-container-lowest border border-solid border-outline-variant rounded-xl px-4 py-3 text-base text-primary focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none placeholder:text-outline";
  const capsLabel =
    "block text-xs font-semibold tracking-wider uppercase text-on-surface-variant";

  // Publish is enabled only once every required field is filled and coherent.
  const timesOk =
    !!startTime && !!endTime && new Date(`${date}T${endTime}`) > new Date(`${date}T${startTime}`);
  const rangeOk = mode === "single" || (!!endDate && new Date(`${endDate}T00:00`) >= new Date(`${date}T00:00`));
  const valid = !!room && title.trim().length > 0 && !!date && timesOk && rangeOk;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight mt-[100px]">
          Schedule Event
        </h2>
        <p className="text-base text-on-surface-variant">
          Create and publish a new event for the coworking community.
        </p>
      </div>

      {/* Action card — rendered at the header's level (via portal), fixed near the top */}
      {actionSlot &&
        createPortal(
          <div
            className="bg-surface-container-lowest ambient-shadow p-4 flex items-center justify-between gap-4"
            style={{ position: "fixed", zIndex: 9999, top: "90px", left: 0, width: "100%" }}
          >
            <p className="text-sm text-on-surface-variant hidden sm:block">
              {valid ? "Ready to publish — everyone gets notified." : "Fill in room, title, date and times to publish."}
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setRoom("");
                }}
                className="text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl text-outline hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="schedule-form"
                disabled={!valid || busy}
                className="text-xs font-semibold tracking-wider uppercase px-8 py-3 rounded-xl bg-primary text-on-primary hover:bg-opacity-90 transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Icon name="publish" size={18} />
                {busy ? "Publishing…" : "Publish Event"}
              </button>
            </div>
          </div>,
          actionSlot
        )}

      <form id="schedule-form" className="flex flex-col gap-6" onSubmit={submit}>
        {/* Main details card */}
        <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 flex flex-col gap-6">
          <div>
            <label className={`${capsLabel} mb-2`} htmlFor="eventTitle">
              Event Title
            </label>
            <input
              id="eventTitle"
              className={field}
              placeholder="e.g., Q3 Networking Mixer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={`${capsLabel} mb-2`} htmlFor="eventDescription">
              Description
            </label>
            <textarea
              id="eventDescription"
              className={`${field} resize-none`}
              placeholder="Describe the event details..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Location + Date/Time grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 h-full flex flex-col">
            <label className={`${capsLabel} mb-4 flex items-center gap-2`}>
              <Icon name="location_on" size={16} /> Room Selection
            </label>
            <div className="relative mt-auto">
              <select
                className={`${field} appearance-none cursor-pointer`}
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              >
                <option disabled value="">
                  Select a workspace...
                </option>
                <option value="A">Study Room A</option>
                <option value="B">Study Room B</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                expand_more
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <label className={`${capsLabel} flex items-center gap-2`}>
                <Icon name="schedule" size={16} /> Date &amp; Time
              </label>
              <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-0.5 border border-solid border-outline-variant/60">
                {["single", "range"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      mode === m ? "bg-primary text-on-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {m === "single" ? "Single day" : "Date range"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              {mode === "range" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-on-surface-variant mb-1">From</span>
                    <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-on-surface-variant mb-1">To</span>
                    <input type="date" className={field} value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} required />
                  </div>
                </div>
              ) : (
                <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} required />
              )}

              <div className="grid grid-cols-2 gap-3">
                <input type="time" className={field} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <input type="time" className={field} value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>

              {mode === "range" && (
                <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  Skip weekends
                  {date && endDate && (
                    <span className="ml-auto text-xs font-medium text-secondary">
                      {buildSlots().length} day{buildSlots().length !== 1 ? "s" : ""}
                    </span>
                  )}
                </label>
              )}
            </div>
          </div>
        </div>

      </form>
    </>
  );
}

/* ---------------- Bookings ---------------- */
function Bookings({ rooms, onEnd }) {
  const items = rooms.filter((r) => r.event || r.next);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight">Bookings</h2>
        <p className="text-base text-on-surface-variant">
          Live and upcoming events. Ending one frees the room and notifies everyone.
        </p>
      </div>

      {items.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-8 text-center text-on-surface-variant">
          <Icon name="event_available" size={40} className="text-secondary mb-2" />
          <p>Both study rooms are free — nothing scheduled.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {rooms.map((r) => {
          const ev = r.event || r.next;
          if (!ev) return null;
          const live = !!r.event;
          return (
            <div key={r.room} className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    live ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <Icon name={live ? "meeting_room" : "schedule"} filled={live} />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
                    Study Room {r.room} · {live ? "In progress" : "Upcoming"}
                  </p>
                  <p className="text-lg font-semibold text-primary">{ev.title}</p>
                  <p className="text-sm text-on-surface-variant">
                    {new Date(ev.start).toLocaleString()} → {new Date(ev.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onEnd(ev.id, r.room)}
                className="text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl bg-error-container text-on-error-container hover:bg-opacity-80 transition-all active:scale-95 flex items-center gap-2"
              >
                <Icon name="event_busy" size={18} />
                End &amp; free
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Settings ---------------- */
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
// Base64 inflates by ~4/3, so this stays under the API's encoded-length ceiling.
const LOGO_MAX_BYTES = 250 * 1024;

function Settings({ onDone }) {
  const current = useLogo();
  const [draft, setDraft] = useState(null); // a picked file, not saved yet
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const shown = draft ?? (current || "");
  const loading = current === undefined && draft === null;

  function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file twice still fires onChange
    if (!file) return;
    setErr("");

    if (!LOGO_TYPES.includes(file.type)) {
      setErr("Use a PNG, JPEG, WebP or SVG image.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setErr("That image is over 250 KB — pick a smaller one.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setDraft(String(reader.result));
    reader.onerror = () => setErr("Could not read that file.");
    reader.readAsDataURL(file);
  }

  async function save(next) {
    setBusy(true);
    setErr("");
    let data = {};
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: next }),
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
    } catch (e) {
      setBusy(false);
      setErr(e.message || "Could not save the logo.");
      return;
    }
    setBusy(false);
    setLogo(next); // repaint every navbar on this device straight away
    setDraft(null);
    onDone({
      type: "ok",
      text: next ? "Logo updated — it now shows on every screen." : "Logo removed.",
    });
  }

  const capsLabel = "block text-xs font-semibold tracking-wider uppercase text-on-surface-variant";

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight">Settings</h2>
        <p className="text-base text-on-surface-variant">
          Branding and app-wide preferences.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 flex flex-col gap-6">
        <div>
          <label className={`${capsLabel} mb-2 flex items-center gap-2`}>
            <Icon name="image" size={16} /> Logo
          </label>
          <p className="text-sm text-on-surface-variant">
            Shown in the navbar on every screen. PNG, JPEG, WebP or SVG, up to 250 KB.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low h-32 flex items-center justify-center p-4">
          {loading ? (
            <span className="text-sm text-on-surface-variant">Loading…</span>
          ) : shown ? (
            <img src={shown} alt="Logo preview" className="max-h-full max-w-[240px] w-auto object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-on-surface-variant">
              <Icon name="domain" filled size={32} />
              <span className="text-xs">No logo yet — the default mark is used.</span>
            </span>
          )}
        </div>

        {draft && (
          <p className="text-sm text-secondary font-medium -mt-3">
            Preview only — save to publish it.
          </p>
        )}
        {err && <p className="text-sm text-error -mt-3">{err}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl bg-surface-container-high text-primary hover:bg-opacity-80 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
            <Icon name="upload" size={18} />
            Choose image
            <input
              type="file"
              accept={LOGO_TYPES.join(",")}
              onChange={pick}
              disabled={busy}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => save(draft)}
            disabled={!draft || busy}
            className="text-xs font-semibold tracking-wider uppercase px-8 py-3 rounded-xl bg-primary text-on-primary hover:bg-opacity-90 transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Icon name="save" size={18} />
            {busy ? "Saving…" : "Save logo"}
          </button>

          {draft && (
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setErr("");
              }}
              disabled={busy}
              className="text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl text-outline hover:text-primary transition-colors"
            >
              Cancel
            </button>
          )}

          {!draft && current && (
            <button
              type="button"
              onClick={() => save("")}
              disabled={busy}
              className="text-xs font-semibold tracking-wider uppercase px-6 py-3 rounded-xl bg-error-container text-on-error-container hover:bg-opacity-80 transition-all active:scale-95 flex items-center gap-2 ml-auto disabled:opacity-50"
            >
              <Icon name="delete" size={18} />
              Remove
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Visitors ---------------- */
function dayKey(d) {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

function Visitors() {
  const [date, setDate] = useState(() => dayKey(new Date())); // default: today
  const [list, setList] = useState(null);
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    setSlot(document.getElementById("admin-action-slot"));
  }, []);

  useEffect(() => {
    let active = true;
    setList(null);
    let url = "/api/visitors";
    if (date) {
      const start = new Date(date + "T00:00");
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      url += `?from=${start.toISOString()}&to=${end.toISOString()}`;
    }
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => active && setList(d.visitors || []))
      .catch(() => active && setList([]));
    return () => {
      active = false;
    };
  }, [date]);

  const filtered = list || [];
  const isToday = date === dayKey(new Date());

  const chip = (active) =>
    `text-xs font-semibold px-3.5 py-2 rounded-full border border-solid transition-colors ${
      active
        ? "bg-secondary-container text-on-secondary-container border-transparent"
        : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"
    }`;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight mt-[100px]">Visitors</h2>
        <p className="text-base text-on-surface-variant">
          People who checked in on the visitor screen.
        </p>
      </div>

      {/* Calendar filter — fixed under the top navbar, like the Schedule action card */}
      {slot &&
        createPortal(
          <div
            className="bg-surface-container-lowest ambient-shadow p-4 flex items-center gap-3"
            style={{ position: "fixed", zIndex: 9999, top: "90px", left: 0, width: "100%" }}
          >
            <Icon name="calendar_month" className="text-secondary" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-surface-container-lowest border border-solid border-outline-variant rounded-xl px-3 py-2 text-sm text-primary outline-none focus:border-secondary"
            />
            <button onClick={() => setDate(dayKey(new Date()))} className={chip(isToday)}>
              Today
            </button>
            <button onClick={() => setDate("")} className={chip(!date)}>
              All
            </button>
            <span className="hidden sm:block ml-auto text-sm font-medium text-on-surface-variant">
              {list === null ? "…" : filtered.length} {filtered.length === 1 ? "check-in" : "check-ins"}
              {date ? ` on ${new Date(date + "T00:00").toLocaleDateString([], { month: "short", day: "numeric" })}` : ""}
            </span>
          </div>,
          slot
        )}

      {list === null ? (
        <p className="text-sm text-on-surface-variant py-8 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-8 text-center text-on-surface-variant">
          <Icon name="event_busy" size={40} className="text-secondary mb-2" />
          <p>{date ? "No check-ins on this day." : "No one has checked in yet."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((v) => (
            <div key={v.id} className="bg-surface-container-lowest rounded-2xl ambient-shadow p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                {v.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-primary">{v.name}</p>
                <p className="text-sm text-on-surface-variant">
                  {v.phone || "No phone"} · {new Date(v.at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
