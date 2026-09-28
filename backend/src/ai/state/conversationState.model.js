import mongoose from "mongoose";

const { Schema } = mongoose;

const selectedHotelSchema = new Schema(
  {
    hotelId: { type: String, required: true },
    hotelName: { type: String, required: true },
    city: { type: String },
    basePrice: { type: Number },
  },
  { _id: false }
);

const selectedRoomSchema = new Schema(
  {
    roomId: { type: String, required: true },
    roomType: { type: String, required: true },
    title: { type: String },
    price: { type: Number, required: true },
    maxGuests: { type: Number },
  },
  { _id: false }
);

const bookingDetailsSchema = new Schema(
  {
    checkIn: { type: String, required: true }, // ISO date string YYYY-MM-DD
    checkOut: { type: String, required: true },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, default: 1 },
    totalPrice: { type: Number },
  },
  { _id: false }
);

const pendingBookingSchema = new Schema(
  {
    hotelId: { type: String, required: true },
    hotelName: { type: String },
    roomId: { type: String, required: true },
    roomType: { type: String },
    checkIn: { type: String },
    checkOut: { type: String },
    guests: { type: Number },
    nights: { type: Number },
    totalPrice: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["stripe", "razorpay", "cod", "STRIPE", "RAZORPAY", "COD"],
    },
    status: {
      type: String,
      enum: [
        "idle",
        "collecting",
        "awaiting_payment",
        "awaiting_confirmation",
        "confirmed",
        "canceled",
        "failed",
      ],
      default: "collecting",
    },
    bookingId: { type: String },
    paymentUrl: { type: String },
  },
  { _id: false }
);

const recommendedHotelSchema = new Schema(
  {
    hotelId: { type: String, required: true },
    hotelName: { type: String, required: true },
    city: { type: String },
    basePrice: { type: Number },
    rating: { type: Number },
    rank: { type: Number },
  },
  { _id: false }
);

const conversationStateSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    currentStep: {
      type: String,
      enum: [
        "IDLE",
        "SEARCH_RESULTS",
        "HOTEL_SELECTED",
        "ROOM_SELECTED",
        "DATES_GUESTS_COLLECTED",
        "PAYMENT_SELECTED",
        "AWAITING_CONFIRMATION",
        "BOOKING_CONFIRMED",
      ],
      default: "IDLE",
    },
    city: { type: String, trim: true },
    selectedHotel: selectedHotelSchema,
    selectedRoom: selectedRoomSchema,
    bookingDetails: bookingDetailsSchema,
    paymentMethod: {
      type: String,
      enum: ["stripe", "razorpay", "cod", "STRIPE", "RAZORPAY", "COD"],
    },
    pendingBooking: pendingBookingSchema,
    recentlyRecommendedHotels: [recommendedHotelSchema],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    version: {
      type: Number,
      default: 1,
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

conversationStateSchema.index({ userId: 1, updatedAt: -1 });

export const ConversationState = mongoose.model(
  "ConversationState",
  conversationStateSchema
);
