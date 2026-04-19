import { Booking } from "../models/booking.models.js";
import { Payment } from "../models/payment.models.js";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Hotel } from "../models/hotel.models.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const paymentOnStripe = async (req, res) => {
  try {
    const userId = req.userId.toString();
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("hotelId", "name");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }


   if (!booking.userId.equals(req.userId)) {
      return res.status(403).json({
      success: false,
      message: "Not authorized to pay for this booking",
  });
}


    
    const existingPayment = await Payment.findOne({
      bookingId,
      paymentStatus: { $in: ["processing", "success"] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already initiated",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Hotel Booking - ${booking.hotelId.name}`,
            },
            unit_amount: booking.totalPrice * 100, 
          },
          quantity: 1,
        },
      ],

      metadata: {
        bookingId: booking._id.toString(),
        userId,
      },

      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
    });

    await Payment.create({
      userId,
      bookingId,
      amount: booking.totalPrice,
      paymentMode: "STRIPE",
      paymentStatus: "processing",
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

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session_id },
      { paymentStatus: "success" },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    await Booking.findByIdAndUpdate(payment.bookingId, {
      status: "booked",
      paymentStatus: "success",
    });

    return res.status(200).json({
      success: true,
      message: "Payment successful & booking confirmed",
    });

  } catch (error) {
    console.error("Stripe verify error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
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
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const order = await razorpay.orders.create({
      amount: booking.totalPrice * 100, 
      currency: "INR",
      receipt: `booking_${bookingId}`,
    });

    
    await Payment.create({
      userId,
      bookingId,
      amount: booking.totalPrice,
      paymentMode: "RAZORPAY",
      paymentStatus: "processing",
      razorpayOrderId: order.id,
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_API_KEY, 
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


    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

  
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: "success",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

 
    await Booking.findByIdAndUpdate(payment.bookingId, {
      status: "booked",
      paymentStatus: "success",
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

export const confirmRazorpayBooking = async (req, res) => {
  const { bookingId } = req.params;

  await Booking.findByIdAndUpdate(bookingId, {
    status: "booked",
    paymentStatus: "success",
  });

  res.json({
    success: true,
    message: "Booking confirmed",
  });
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

 
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    await Payment.create({
      userId,
      bookingId,
      amount: booking.totalPrice,
      paymentMode: "COD",
      paymentStatus: "pending",
    });

  
    await Booking.findByIdAndUpdate(bookingId, {
      status: "booked",
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

export const getMyPayments = async (req, res) => {
  try {
    const userId = req.userId;

    const payments = await Payment.find({ userId })
      .populate({
        path: "bookingId",
        select: "hotelId checkIn checkOut totalPrice status paymentStatus",
        populate: {
          path: "hotelId",
          select: "name city",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });

  } catch (error) {
    console.error("Get user payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};
export const getHotelPayments = async (req, res) => {
  try {
    const ownerId = req.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const hotel = await Hotel.findOne({ owner: ownerId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const bookingIds = await Booking.find({ hotelId: hotel._id }).distinct("_id");

    const totalPayments = await Payment.countDocuments({
      bookingId: { $in: bookingIds },
    });

    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
    })
      .populate({
        path: "bookingId",
        select: "checkIn checkOut totalPrice status paymentStatus",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return res.status(200).json({
      success: true,
      hotel: {
        name: hotel.name,
        city: hotel.city,
      },
      payments,

      // ✅ SEND THIS
      currentPage: page,
      totalPages: Math.ceil(totalPayments / limit),
      totalPayments,
    });

  } catch (error) {
    console.error("Get hotel payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotel payments",
    });
  }
};
