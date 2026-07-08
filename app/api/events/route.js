import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event, ROOMS } from "@/lib/models";
import { isAdmin } from "@/lib/auth";
import { notifyAll } from "@/lib/webpush";

export const dynamic = "force-dynamic";

// Bookings feed. Default: upcoming + in-progress (visitor busy-times).
// With ?from=ISO&to=ISO: every active event overlapping that window
// (past included) — used by the admin calendar view.
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query;
  if (from && to && !isNaN(Date.parse(from)) && !isNaN(Date.parse(to))) {
    query = { status: "active", start: { $lt: new Date(to) }, end: { $gt: new Date(from) } };
  } else {
    query = { status: "active", end: { $gt: new Date() } };
  }

  const events = await Event.find(query).sort({ start: 1 }).limit(500).lean();

  return NextResponse.json({
    events: events.map((e) => ({
      id: String(e._id),
      room: e.room,
      title: e.title,
      start: e.start,
      end: e.end,
    })),
  });
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtWhen(d) {
  return new Date(d).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Admin posts an event to a room. The room flips to "booked" and every
// subscriber gets a push notification.
export async function POST(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { room, title, description, start, end } = await req.json();

  if (!ROOMS.includes(room) || !title || !start || !end) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (!(startDate < endDate)) {
    return NextResponse.json(
      { error: "End time must be after the start time." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Block only if the new booking overlaps an existing one in the same room.
    const clash = await Event.findOne({
      room,
      status: "active",
      start: { $lt: endDate },
      end: { $gt: startDate },
    });
    if (clash) {
      return NextResponse.json(
        {
          error: `Room ${room} already has a booking that overlaps that time (${fmtWhen(
            clash.start
          )}–${fmtTime(clash.end)}).`,
        },
        { status: 409 }
      );
    }

    const event = await Event.create({
      room,
      title,
      description: description || "",
      start: startDate,
      end: endDate,
      status: "active",
    });

    // Wording depends on whether it starts now or later.
    const now = new Date();
    const live = startDate <= now && endDate > now;
    await notifyAll(
      live
        ? {
            title: `🔴 Room ${room} booked`,
            body: `${title} · until ${fmtTime(end)}`,
            url: "/",
          }
        : {
            title: `🟠 Room ${room} — new booking`,
            body: `${title} · ${fmtWhen(start)}`,
            url: "/",
          }
    );

    return NextResponse.json({ id: String(event._id) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/events failed:", err.message);
    const conn = /whitelist|could not connect|serverselection|etimedout|enotfound|topology/i.test(
      err.message || ""
    );
    return NextResponse.json(
      {
        error: conn
          ? "Could not reach the database. Please check the connection and try again."
          : "Could not save the event. Please try again.",
      },
      { status: 500 }
    );
  }
}
