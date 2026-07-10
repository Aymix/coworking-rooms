import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Setting } from "@/lib/models";
import { isAdmin } from "@/lib/auth";

const SETTINGS_KEY = "app";

// Data URLs only — the logo is inlined into every screen, never fetched cross-origin.
const LOGO_RE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/;
const LOGO_MAX = 400_000; // encoded length — comfortably above the 250 KB the UI allows

// Public: every screen reads the logo. A DB blip must not blank the navbar,
// so fall back to "no logo" rather than erroring.
export async function GET() {
  try {
    await connectDB();
    const s = await Setting.findOne({ key: SETTINGS_KEY }).lean();
    return NextResponse.json({ logo: s?.logo || "" });
  } catch (e) {
    return NextResponse.json({ logo: "" });
  }
}

// Admin only. Send { logo: "" } to remove the current logo.
export async function PUT(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { logo } = await req.json();
  const next = typeof logo === "string" ? logo : "";

  if (next && !LOGO_RE.test(next)) {
    return NextResponse.json(
      { error: "Logo must be a PNG, JPEG, WebP or SVG image." },
      { status: 400 }
    );
  }
  if (next.length > LOGO_MAX) {
    return NextResponse.json(
      { error: "Logo is too large — keep it under 250 KB." },
      { status: 413 }
    );
  }

  await connectDB();
  await Setting.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { logo: next },
    { upsert: true, new: true }
  );
  return NextResponse.json({ ok: true, logo: next });
}
