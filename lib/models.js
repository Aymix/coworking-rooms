import mongoose from "mongoose";

// The two fixed rooms in the coworking space.
export const ROOMS = ["A", "B"];

const EventSchema = new mongoose.Schema(
  {
    room: { type: String, enum: ROOMS, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    seriesId: { type: String, default: null }, // groups a multi-date series
  },
  { timestamps: true }
);

const SubscriberSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    subscription: { type: Object, required: true },
  },
  { timestamps: true }
);

const VisitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// Singleton document (key: "app") holding admin-editable app settings.
// The logo is kept as a data URL — the app runs in a container with no
// persistent disk, so an uploaded file would be lost on the next deploy.
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    logo: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Event =
  mongoose.models.Event || mongoose.model("Event", EventSchema);
export const Setting =
  mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
export const Subscriber =
  mongoose.models.Subscriber || mongoose.model("Subscriber", SubscriberSchema);
export const Visitor =
  mongoose.models.Visitor || mongoose.model("Visitor", VisitorSchema);
