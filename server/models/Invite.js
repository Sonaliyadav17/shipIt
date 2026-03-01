import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
    email: { type: String, required: true },
    inviterId: { type: String, required: true },
    inviterName: { type: String, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Invite || mongoose.model("Invite", InviteSchema);
