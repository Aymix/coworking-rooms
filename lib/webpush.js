import webpush from "web-push";
import { connectDB } from "./mongodb";
import { Subscriber } from "./models";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send a notification payload to every stored subscriber.
// Automatically prunes subscriptions the push service reports as gone (404/410).
export async function notifyAll(payload) {
  await connectDB();
  const subs = await Subscriber.find({}).lean();
  const body = JSON.stringify(payload);
  const stale = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, body);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          stale.push(s.endpoint);
        }
      }
    })
  );

  if (stale.length) {
    await Subscriber.deleteMany({ endpoint: { $in: stale } });
  }

  return { sent: subs.length - stale.length, pruned: stale.length };
}
