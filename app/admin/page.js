"use client";

import { useEffect, useState, useCallback } from "react";

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
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
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
    <div className="min-h-screen bg-background text-on-surface font-sans flex items-center justify-center px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl ambient-shadow p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <Icon name="domain" filled size={32} className="text-primary" />
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
  { key: "bookings", label: "Bookings", icon: "bookmark" },
  { key: "visitors", label: "Visitors", icon: "groups" },
];

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("schedule");
  const [rooms, setRooms] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      setRooms((await res.json()).rooms || []);
      const vr = await fetch("/api/visitors", { cache: "no-store" });
      if (vr.ok) setVisitors((await vr.json()).visitors || []);
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
          <Icon name="domain" filled size={32} className="text-primary" />
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
        <ul className="flex-1 px-4 flex flex-col gap-2">
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
        <div className="px-4 mt-auto">
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
        <header className="md:hidden w-full top-0 sticky bg-surface border-b border-solid border-outline-variant z-40 flex justify-between items-center px-5 py-4">
          <a href="/" className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95">
            <Icon name="arrow_back" />
          </a>
          <h1 className="text-xl font-bold text-primary">CoWork Hub</h1>
          <button onClick={logout} className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 active:scale-95">
            <Icon name="logout" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-4xl mx-auto w-full pb-32 md:pb-12">
          {msg && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                msg.type === "ok"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              <Icon name={msg.type === "ok" ? "check_circle" : "error"} size={18} />
              {msg.text}
            </div>
          )}

          {tab === "schedule" && <ScheduleForm rooms={rooms} onDone={(m) => { setMsg(m); load(); }} />}
          {tab === "bookings" && <Bookings rooms={rooms} onEnd={endEvent} />}
          {tab === "visitors" && <Visitors visitors={visitors} />}
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
              className={`flex flex-col items-center justify-center px-4 py-1 rounded-full active:scale-90 transition-colors ${
                active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:text-primary"
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

  useEffect(() => {
    const now = new Date();
    const p = (n) => String(n).padStart(2, "0");
    setDate(`${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`);
    setStartTime(`${p(now.getHours())}:${p(now.getMinutes())}`);
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setEndTime(`${p(later.getHours())}:${p(later.getMinutes())}`);
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!room) {
      onDone({ type: "err", text: "Select a workspace first." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room,
        title,
        description,
        start: new Date(`${date}T${startTime}`).toISOString(),
        end: new Date(`${date}T${endTime}`).toISOString(),
      }),
    });
    setBusy(false);
    const data = await res.json();
    if (res.ok) {
      setTitle("");
      setDescription("");
      onDone({ type: "ok", text: `Published to Study Room ${room} — everyone notified.` });
    } else {
      onDone({ type: "err", text: data.error || "Failed to publish." });
    }
  }

  const field =
    "w-full bg-surface-container-lowest border border-solid border-outline-variant rounded-xl px-4 py-3 text-base text-primary focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none placeholder:text-outline";
  const capsLabel =
    "block text-xs font-semibold tracking-wider uppercase text-on-surface-variant";

  // Publish is enabled only once every required field is filled and coherent.
  const valid =
    !!room &&
    title.trim().length > 0 &&
    !!date &&
    !!startTime &&
    !!endTime &&
    new Date(`${date}T${endTime}`) > new Date(`${date}T${startTime}`);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight">
          Schedule Event
        </h2>
        <p className="text-base text-on-surface-variant">
          Create and publish a new event for the coworking community.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={submit}>
        {/* Action card */}
        <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-4 flex items-center justify-between gap-4">
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
              disabled={!valid || busy}
              className="text-xs font-semibold tracking-wider uppercase px-8 py-3 rounded-xl bg-primary text-on-primary hover:bg-opacity-90 transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Icon name="publish" size={18} />
              {busy ? "Publishing…" : "Publish Event"}
            </button>
          </div>
        </div>
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
            <label className={`${capsLabel} mb-4 flex items-center gap-2`}>
              <Icon name="schedule" size={16} /> Date &amp; Time
            </label>
            <div className="flex flex-col gap-4 mt-auto">
              <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className={field} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <input type="time" className={field} value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
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

/* ---------------- Visitors ---------------- */
function Visitors({ visitors }) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-tight">Visitors</h2>
        <p className="text-base text-on-surface-variant">
          People who checked in on the visitor screen ({visitors.length}).
        </p>
      </div>

      {visitors.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-8 text-center text-on-surface-variant">
          <Icon name="groups" size={40} className="text-secondary mb-2" />
          <p>No one has checked in yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visitors.map((v) => (
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
    </>
  );
}
