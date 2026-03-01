import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "on hold", "shipped"], default: "active" },
    dueDate: { type: String, default: "" },
    ownerId: { type: String, required: true },
    teamMembers: { type: [String], default: [] },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isOpenToInvestment: { type: Boolean, default: false },
    aiPlan: {
        summary: { type: String, default: "" },
        features: { type: [String], default: [] },
        additionalIdeas: { type: [String], default: [] },
        marketOpportunity: { type: String, default: "" },
        businessPitch: { type: String, default: "" },
        risks: { type: [String], default: [] },
        timeline: { type: [String], default: [] },
    },
    pitchGenerated: { type: Boolean, default: false },
    pitchScore: { type: Number, default: 0 },
    thinkingNoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'ThinkingNote' },
    createdAt: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
