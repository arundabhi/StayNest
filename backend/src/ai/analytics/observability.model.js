import mongoose from "mongoose";

const { Schema } = mongoose;

const aiObservabilityLogSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    query: { type: String, required: true },
    intent: { type: String, required: true, index: true },
    agentUsed: { type: String, required: true, index: true },
    resolvedBy: { type: String },
    toolsUsed: [{ type: String }],
    latencyMs: { type: Number, required: true },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    success: { type: Boolean, default: true, index: true },
    errorMessage: { type: String },
    stateSnapshot: {
      currentStep: String,
      city: String,
      selectedHotelId: String,
      selectedRoomId: String,
      pendingBookingStatus: String,
    },
  },
  { timestamps: true }
);

aiObservabilityLogSchema.index({ createdAt: -1 });

export const AIObservabilityLog = mongoose.model(
  "AIObservabilityLog",
  aiObservabilityLogSchema
);
