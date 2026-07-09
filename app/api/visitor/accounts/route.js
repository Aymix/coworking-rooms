import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Visitor } from "@/lib/models";

export const dynamic = "force-dynamic";

// Public: distinct previously-used visitor accounts (name only — phones are
// never exposed publicly). Lets a returning visitor pick their name instead
// of retyping it.
export async function GET() {
  await connectDB();
  const recent = await Visitor.find({}).sort({ createdAt: -1 }).limit(300).lean();

  const seen = new Set();
  const accounts = [];
  for (const v of recent) {
    const key = (v.name || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    accounts.push({ id: String(v._id), name: v.name });
    if (accounts.length >= 40) break;
  }

  return NextResponse.json({ accounts });
}
