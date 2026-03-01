import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["todo", "inprogress", "blocked", "done"], default: "todo" },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    assigneeId: { type: String, default: "" },
    assigneeName: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
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

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
