import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  // role is optional; don't default to null because that value fails the enum
  // validation. leave undefined when not set so mongoose skips it.
  role: { type: String, enum: ["builder", "investor"], required: false },
  investmentFocus: { type: String, default: null },
  appearance: { type: String, enum: ["light", "dark", "system"], default: "dark" },
  notifications: {
    emailNotif: { type: Boolean, default: true },
    pushNotif: { type: Boolean, default: true },
    inAppAlerts: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
