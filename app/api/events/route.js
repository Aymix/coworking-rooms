import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event, ROOMS } from "@/lib/models";
import { isAdmin } from "@/lib/auth";
import { notifyAll } from "@/lib/webpush";

export const dynamic = "force-dynamic";

// Public: upcoming and in-progress bookings for both rooms, soonest first.
// Used by the visitor screen to show each room's unavailable time slots.
export async function GET() {
  await connectDB();
  const now = new Date();
  const events = await Event.find({ status: "active", end: { $gt: now } })
    .sort({ start: 1 })
    .limit(50)
    .lean();

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
    return NextResponse.json(
      { error: "Could not save the event. " + err.message },
      { status: 500 }
    );
  }
}
