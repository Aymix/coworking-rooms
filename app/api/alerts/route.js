import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models";

export const dynamic = "force-dynamic";

// Public alerts feed for the visitor screen:
//  - reminders: bookings happening today or tomorrow (incl. in progress)
//  - alerts: recent activity — events posted (booked) and ended (freed)
export async function GET() {
  await connectDB();
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endTomorrow = new Date(startToday);
  endTomorrow.setDate(endTomorrow.getDate() + 2); // exclusive bound

  const reminders = await Event.find({
    status: "active",
    end: { $gt: now },
    start: { $lt: endTomorrow },
  })
    .sort({ start: 1 })
    .lean();

  const recent = await Event.find({}).sort({ updatedAt: -1 }).limit(30).lean();
  const alerts = [];
  for (const e of recent) {
    if (e.status === "ended") {
      alerts.push({
        id: `${e._id}-freed`,
        type: "freed",
        at: e.updatedAt,
        room: e.room,
        title: e.title,
      });
    }
    alerts.push({
      id: `${e._id}-booked`,
      type: "booked",
      at: e.createdAt,
      room: e.room,
      title: e.title,
      start: e.start,
      end: e.end,
    });
  }
  alerts.sort((a, b) => new Date(b.at) - new Date(a.at));

  return NextResponse.json({
    reminders: reminders.map((e) => ({
      id: String(e._id),
      room: e.room,
      title: e.title,
      start: e.start,
      end: e.end,
    })),
    alerts: alerts.slice(0, 20),
  });
}
