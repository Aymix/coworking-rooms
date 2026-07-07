# Coworking Rooms

A PWA that shows the live availability of the coworking space's two rooms (A and B)
and pushes a notification to everyone the moment a room is booked or freed.

## How it works

- **Members** open the app (no login), tap **Enable alerts** once, and get a push
  notification whenever a room's status changes.
- **Admin** signs in, posts an event to a room, and everyone is notified. Ending an
  event frees the room and notifies everyone again.
- Room status is derived: a room is **booked** while it has an active event, else **free**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Admin panel: `/admin` — demo login **admin / demo1234**.

## Environment (`.env.local`)

| Key | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (database `co_room_db`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push VAPID keys |
| `VAPID_SUBJECT` | contact `mailto:` for push |
| `ADMIN_USER` / `ADMIN_PASSWORD` | demo admin credentials |
| `ADMIN_TOKEN` | value stored in the admin session cookie |

Regenerate VAPID keys with: `node -e "console.log(require('web-push').generateVAPIDKeys())"`

## Notifications — the catch

Browsers require the user to tap **Allow** once; you can't silently force push.
On **iPhone**, web push only works after the user adds the app to the Home Screen
(Safari → Share → Add to Home Screen) and opens it from there. The app nudges users
through this. Push also requires **HTTPS** in production (localhost is exempt).

## Data model (MongoDB)

- `events`: `{ room: "A"|"B", title, description, start, end, status: "active"|"ended" }`
- `subscribers`: `{ endpoint, subscription }`

## Stack

Next.js 16 (App Router) · Mongoose · web-push · service worker + Web Manifest.
