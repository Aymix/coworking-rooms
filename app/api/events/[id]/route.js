import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models";
import { isAdmin } from "@/lib/auth";
import { notifyAll } from "@/lib/webpush";

// Admin ends an active event. The room flips back to "free" and every
// subscriber is notified that the room is available again.
export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const event = await Event.findById(id);
  if (!event || event.status === "ended") {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  event.status = "ended";
  await event.save();

  await notifyAll({
    title: `🟢 Room ${event.room} is now free`,
    body: `Room ${event.room} just became available.`,
    url: "/",
  });

  return NextResponse.json({ ok: true });
}
