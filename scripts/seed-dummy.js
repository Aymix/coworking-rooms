// Seeds dummy events + visitors for demos. Writes straight to MongoDB so no
// push notifications are fired. Run:  MONGODB_URI=... node scripts/seed-dummy.js
const mongoose = require("mongoose");

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("Set MONGODB_URI first");
  process.exit(1);
}

const h = (n) => new Date(Date.now() + n * 3600 * 1000);
const at = (daysAhead, hour, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, min, 0, 0);
  return d;
};

const events = [
  // Room A — occupied right now, then busy later
  {
    room: "A",
    title: "Design Sprint Workshop",
    description: "Hands-on UI/UX sprint — bring your laptop.",
    start: h(-0.5),
    end: h(1.5),
    status: "active",
  },
  {
    room: "A",
    title: "Client Presentation",
    description: "Quarterly demo for the Nexus account.",
    start: h(3),
    end: h(4),
    status: "active",
  },
  {
    room: "A",
    title: "Team Standup + Planning",
    description: "Weekly planning session.",
    start: at(1, 10, 0),
    end: at(1, 11, 30),
    status: "active",
  },
  // Room B — reserved on future days only (shows the orange "Not booked" state)
  {
    room: "B",
    title: "French Conversation Club",
    description: "Casual practice, all levels welcome.",
    start: at(1, 18, 15),
    end: at(1, 19, 45),
    status: "active",
  },
  {
    room: "B",
    title: "Startup Pitch Practice",
    description: "5-minute pitches with feedback.",
    start: at(1, 14, 0),
    end: at(1, 16, 0),
    status: "active",
  },
  {
    room: "B",
    title: "Yoga & Stretch Session",
    description: "Morning reset before work.",
    start: at(2, 9, 0),
    end: at(2, 10, 0),
    status: "active",
  },
];

const visitors = [
  { name: "Sami Ben Ali", phone: "+216 20 123 456" },
  { name: "Leila Trabelsi", phone: "+216 55 789 012" },
  { name: "Omar Gharbi", phone: "" },
  { name: "Yasmine Bouazizi", phone: "+216 98 345 678" },
];

(async () => {
  await mongoose.connect(URI, { bufferCommands: false });
  const db = mongoose.connection.db;

  const wiped = await db.collection("events").deleteMany({});
  await db.collection("visitors").deleteMany({});
  await db.collection("events").insertMany(
    events.map((e) => ({ ...e, createdAt: new Date(), updatedAt: new Date() }))
  );

  const now = Date.now();
  await db.collection("visitors").insertMany(
    visitors.map((v, i) => ({
      ...v,
      createdAt: new Date(now - (i + 1) * 47 * 60 * 1000),
      updatedAt: new Date(now - (i + 1) * 47 * 60 * 1000),
    }))
  );

  console.log(`wiped ${wiped.deletedCount} old events`);
  console.log(`inserted ${events.length} events, ${visitors.length} visitors`);
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
