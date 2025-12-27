import { Booking } from "../models/booking.models.js";
import { Payment } from "../models/payment.models.js";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const paymentOnStripe = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;

    // 1️⃣ Get booking from DB (NEVER trust frontend)
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2️⃣ Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Hotel Booking - ${booking.hotelId}`,
            },
            unit_amount: booking.totalPrice * 100, // ₹ → paise
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
    });

    // 3️⃣ Create Payment record
    await Payment.create({
      userId,
      bookingId,
      amount: booking.totalPrice,
      paymentMode: "STRIPE",
      paymentStatus: "created",
      stripeSessionId: session.id,
    });

    return res.status(200).json({
      success: true,
      sessionUrl: session.url,
    });

  } catch (error) {
    console.error("Stripe payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Stripe payment failed",
    });
  }
};
export const verifyStripePayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // Update payment
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session_id },
      { paymentStatus: "success" },
      { new: true }
    );

    // Confirm booking
    await Booking.findByIdAndUpdate(payment.bookingId, {
      status: "confirmed",
      paymentStatus: "confirm",
    });

    return res.status(200).json({
      success: true,
      message: "Payment successful & booking confirmed",
    });

  } catch (error) {
    console.error("Stripe verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Stripe verification failed",
    });
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;

    // 1️⃣ Get booking (never trust frontend price)
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2️⃣ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: booking.totalPrice, // ₹ → paise
      currency: "INR",
      receipt: `booking_${bookingId}`,
    });

    // 3️⃣ Save payment record
    await Payment.create({
      userId,
      bookingId,
      amount: booking.totalPrice,
      paymentMode: "RAZORPAY",
      paymentStatus: "created",
      razorpayOrderId: order.id,
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_API_KEY, // frontend needs this
    });

  } catch (error) {
    console.error("create razorpay order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1️⃣ Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // 2️⃣ Compare signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // 3️⃣ Update payment
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: "success",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    // 4️⃣ Confirm booking
    await Booking.findByIdAndUpdate(payment.bookingId, {
      status: "confirmed",
      paymentStatus: "confirm",
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified & booking confirmed",
    });

  } catch (error) {
    console.error("verify razorpay payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification error",
    });
  }
};

export const paymentOnCOD = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // 1️⃣ Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2️⃣ Create payment entry (COD)
    await Payment.create({
      userId,
      bookingId,
      amount: booking.totalPrice,
      paymentMode: "COD",
      paymentStatus: "pending", // money not collected yet
    });

    // 3️⃣ Confirm booking immediately
    await Booking.findByIdAndUpdate(bookingId, {
      status: "confirmed",
      paymentStatus: "pending",
    });

    return res.status(200).json({
      success: true,
      message: "Booking confirmed with Cash on Delivery",
    });

  } catch (error) {
    console.error("COD payment error:", error);
    return res.status(500).json({
      success: false,
      message: "COD payment failed",
    });
  }
};