import { ConversationState } from "./conversationState.model.js";

export class ConversationStateRepository {
  /**
   * Find state by sessionId
   */
  async findBySessionId(sessionId) {
    if (!sessionId) return null;
    return await ConversationState.findOne({ sessionId }).lean();
  }

  /**
   * Find state by userId
   */
  async findByUserId(userId) {
    if (!userId) return null;
    return await ConversationState.findOne({ userId })
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Upsert conversation state atomically
   */
  async upsertState(sessionId, stateData) {
    if (!sessionId) {
      throw new Error("sessionId is required to persist state");
    }

    const { _id, createdAt, updatedAt, __v, version, ...dataToSave } = stateData;

    // Refresh TTL expiration to 7 days on update
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await ConversationState.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          ...dataToSave,
          expireAt,
        },
        $inc: { version: 1 },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return updated;
  }

  /**
   * Partially update specific state fields
   */
  async patchState(sessionId, patchData) {
    if (!sessionId) throw new Error("sessionId is required");

    const { _id, createdAt, updatedAt, __v, version, ...cleanPatch } = patchData;
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return await ConversationState.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          ...cleanPatch,
          expireAt,
        },
        $inc: { version: 1 },
      },
      { new: true, upsert: true }
    ).lean();
  }

  /**
   * Reset / clear state back to IDLE
   */
  async resetState(sessionId, userId = null) {
    const defaultState = {
      sessionId,
      userId,
      currentStep: "IDLE",
      city: undefined,
      selectedHotel: undefined,
      selectedRoom: undefined,
      bookingDetails: undefined,
      paymentMethod: undefined,
      pendingBooking: undefined,
      recentlyRecommendedHotels: [],
      metadata: {},
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    return await ConversationState.findOneAndUpdate(
      { sessionId },
      { $set: defaultState, $inc: { version: 1 } },
      { new: true, upsert: true }
    ).lean();
  }

  /**
   * Delete state
   */
  async deleteState(sessionId) {
    return await ConversationState.deleteOne({ sessionId });
  }
}

export const conversationStateRepository = new ConversationStateRepository();
