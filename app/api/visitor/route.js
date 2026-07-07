import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Visitor } from "@/lib/models";

// A visitor optionally leaves their name + phone so the admin can see who's in.
export async function POST(req) {
  const { name, phone } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectDB();
  const v = await Visitor.create({ name: name.trim(), phone: (phone || "").trim() });
  return NextResponse.json({ id: String(v._id) }, { status: 201 });
}
