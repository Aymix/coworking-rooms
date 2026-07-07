import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event, ROOMS } from "@/lib/models";

export const dynamic = "force-dynamic";

function shape(e) {
  return {
    id: String(e._id),
    title: e.title,
    description: e.description,
    start: e.start,
    end: e.end,
  };
}

// Returns each room's status, derived from active events by calendar day:
//  - booked   : "Reserved" — a reservation today (in progress or later today)
//  - upcoming : "Not booked" — reserved on a future day only
//  - free     : "Free" — no reservations at all
export async function GET() {
  await connectDB();
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Active, not-yet-finished events.
  const events = await Event.find({ status: "active", end: { $gt: now } })
    .sort({ start: 1 })
    .lean();

  const rooms = ROOMS.map((room) => {
    const forRoom = events.filter((e) => e.room === room);
    const current = forRoom.find((e) => e.start <= now && e.end > now) || null;
    const next = forRoom.find((e) => e.start > now) || null;
    const reservedToday =
      !!current || forRoom.some((e) => e.start > now && e.start <= endOfToday);

    let status = "free";
    if (reservedToday) status = "booked";
    else if (next) status = "upcoming";

    return {
      room,
      status,
      event: current ? shape(current) : null,
      next: next ? shape(next) : null,
    };
  });

  return NextResponse.json({ rooms });
}
