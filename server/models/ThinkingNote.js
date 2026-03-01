import mongoose from "mongoose";

const thinkingNoteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "converted"], default: "draft" },
    ownerId: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
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
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
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

thinkingNoteSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

thinkingNoteSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

export default mongoose.models.ThinkingNote || mongoose.model("ThinkingNote", thinkingNoteSchema);
