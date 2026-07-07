import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Visitor } from "@/lib/models";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Admin-only: the list of visitors who left their details.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const visitors = await Visitor.find({}).sort({ createdAt: -1 }).limit(100).lean();

  return NextResponse.json({
    visitors: visitors.map((v) => ({
      id: String(v._id),
      name: v.name,
      phone: v.phone,
      at: v.createdAt,
    })),
  });
}
