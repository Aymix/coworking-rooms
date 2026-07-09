import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Visitor } from "@/lib/models";

// A visitor checks in — either with a new name + phone, or by picking an
// existing account (accountId), which records a fresh check-in reusing the
// stored name + phone so the admin still sees them.
export async function POST(req) {
  const { name, phone, accountId } = await req.json();
  await connectDB();

  if (accountId) {
    const acc = await Visitor.findById(accountId).lean().catch(() => null);
    if (!acc) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const v = await Visitor.create({ name: acc.name, phone: acc.phone || "" });
    return NextResponse.json({ id: String(v._id) }, { status: 201 });
  }

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const v = await Visitor.create({ name: name.trim(), phone: (phone || "").trim() });
  return NextResponse.json({ id: String(v._id) }, { status: 201 });
}
