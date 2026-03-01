import mongoose from "mongoose";

const investmentInterestSchema = new mongoose.Schema({
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    builderId: { type: String, required: true },
    investorId: { type: String, required: true },
    investorName: { type: String, required: true },
    contributionType: { type: String, enum: ["money", "idea", "both"], required: true },
    amount: { type: Number },
    ideaDescription: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
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

export default mongoose.models.InvestmentInterest || mongoose.model("InvestmentInterest", investmentInterestSchema);
