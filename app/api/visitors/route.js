import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Visitor } from "@/lib/models";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Admin-only: the list of visitors who left their details.
// Optional ?from=ISO&to=ISO filters check-ins to a single day (server-side).
export async function GET(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const query = {};
  if (from && to && !isNaN(Date.parse(from)) && !isNaN(Date.parse(to))) {
    query.createdAt = { $gte: new Date(from), $lt: new Date(to) };
  }

  const visitors = await Visitor.find(query).sort({ createdAt: -1 }).limit(200).lean();

  return NextResponse.json({
    visitors: visitors.map((v) => ({
      id: String(v._id),
      name: v.name,
      phone: v.phone,
      at: v.createdAt,
    })),
  });
}
