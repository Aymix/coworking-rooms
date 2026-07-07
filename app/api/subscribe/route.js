import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Subscriber } from "@/lib/models";

// Store (or refresh) a browser push subscription. Called after the user
// grants notification permission.
export async function POST(req) {
  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await connectDB();
  await Subscriber.updateOne(
    { endpoint: subscription.endpoint },
    { $set: { endpoint: subscription.endpoint, subscription } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
