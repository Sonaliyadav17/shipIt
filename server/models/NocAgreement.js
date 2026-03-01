import mongoose from "mongoose";

const nocAgreementSchema = new mongoose.Schema({
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    builderId: { type: String, required: true },
    builderName: { type: String, required: true },
    investorId: { type: String, required: true },
    investorName: { type: String, required: true },
    builderSignature: { type: String },
    builderSignedAt: { type: Date },
    investorSignature: { type: String },
    investorSignedAt: { type: Date },
    status: { type: String, enum: ["pending", "signed"], default: "pending" },
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

export default mongoose.models.NocAgreement || mongoose.model("NocAgreement", nocAgreementSchema);
