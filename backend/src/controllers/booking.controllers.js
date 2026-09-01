import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { calculateDynamicPrice } from "../utils/calculateDynamicPrice.utils.js";
import mongoose from "mongoose";
import { autoPromoteWaitlist } from "./waitlist.controllers.js";
import { calculateFinalPrice } from "../utils/calculateFinalPrice.js";
import { Coupon } from "../models/coupone.models.js";
import { calculateCouponDiscount } from "../utils/coupon.js";
import { Payment } from "../models/payment.models.js";
import { getSpecialOffers } from "./recommendation.controllers.js";
import transporter, { mailOptions } from "../utils/sendEmail.utils.js";

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      checkIn,
      checkOut,
      totalGuest,
      paymentMode,
      couponCode: couponCodeFromClient,
    } = req.body;

    const userId = req.userId;
    const { hotelId, roomId } = req.params;


    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: "Please login to book a room",
      });
    }

    if (
      !hotelId ||
      !roomId ||
      !checkIn ||
      !checkOut ||
      !totalGuest ||
      !paymentMode
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }



    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    let specialOfferPercent = 0;
    let specialOfferAmount = 0;

    if (start < today) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past",
      });
    }

    if (end <= start) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in",
      });
    }


    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid booking duration",
      });
    }


    const room = await Room.findById(roomId)
      .session(session)
      .select("+totalRooms +maxGuests +pricePerDay +hotelId +isAvailable");

    if (!room) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.hotelId.toString() !== hotelId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Room does not belong to this hotel",
      });
    }

    if (room.maxGuests < totalGuest) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Guest count exceeds room capacity",
      });
    }

    if (!room.isAvailable) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Room temporarily unavailable",
      });
    }



    const overlappingBookings = await Booking.countDocuments({
      roomId,
      $or: [
  {
    status: "booked"
  },
  {
    status: "pending",
    holdExpiresAt: {
      $gt: new Date()
    }
  }
],
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    }).session(session);

    if (overlappingBookings >= room.totalRooms) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Room not available for selected dates",
      });
    }

    const occupancyRate =
      room.totalRooms > 0
        ? overlappingBookings / room.totalRooms
        : 0;



    const dynamicPricing = await calculateDynamicPrice({
      basePrice: room.pricePerDay,
      checkIn: start,
      checkOut: end,
      hotelId,
      occupancyRate,
    });

    const pricePerDay = dynamicPricing.pricePerDay;



    const pricing = calculateFinalPrice({
      pricePerDay,
      nights,
    });

    /*
    pricing = {
      subtotal,
      gstAmount,
      serviceFee,
      totalPrice
    }
    */

    let baseSubtotal = pricing.subtotal;


    let couponApplied = false;
    let couponCode = null;
    let subtotal = pricing.subtotal;


    const offer = await getSpecialOfferForHotel(hotelId);

    if (offer) {
      if (offer.discountType === "PERCENTAGE") {
        specialOfferPercent = offer.discountValue;
        specialOfferAmount = Math.round(
          (subtotal * specialOfferPercent) / 100
        );
      } else if (offer.discountType === "FLAT") {
        specialOfferPercent = 0;
        specialOfferAmount = Math.min(offer.discountValue, subtotal);
      }
      subtotal -= specialOfferAmount;

      // If this special offer was derived from a hotel-specific coupon, increment its usedCount
      const today = new Date();
      const matchedCoupon = await Coupon.findOne({
        hotelId: hotelId,
        isActive: true,
        expiryDate: { $gte: today },
      }).session(session);
      if (matchedCoupon && (matchedCoupon.usedCount || 0) < matchedCoupon.usageLimit) {
        matchedCoupon.usedCount = (matchedCoupon.usedCount || 0) + 1;
        await matchedCoupon.save({ session });
      }
    }


    let couponDiscount = 0;

    if (couponCodeFromClient) {
      const coupon = await Coupon.findOne({
        code: couponCodeFromClient.toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() },
      }).session(session);

      if (!coupon) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid or expired coupon",
        });
      }

      if ((coupon.usedCount || 0) >= coupon.usageLimit) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit reached",
        });
      }

      if (subtotal < coupon.minimumBookingAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Minimum booking amount is ${coupon.minimumBookingAmount}`,
        });
      }

      couponDiscount = calculateCouponDiscount(coupon, subtotal);
      subtotal -= couponDiscount;
      couponApplied = couponDiscount > 0;
      couponCode = coupon.code;

      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save({ session });
    }


    const gstAmount = Math.round(subtotal * 0.12);
    const serviceFee = pricing.serviceFee;

    const finalTotal = subtotal + gstAmount + serviceFee;

    const discountAmount = specialOfferAmount + couponDiscount;

    const normalizedPayment = paymentMode.toUpperCase();


    const booking = await Booking.create(
      [
        {
          userId,
          hotelId,
          roomId,
          checkIn: start,
          checkOut: end,
          totalGuest,
          paymentMode: normalizedPayment,

          pricePerNight: pricePerDay,

          basePrice: pricing.subtotal + discountAmount,
          discountAmount,

          specialOfferPercent,
          specialOfferAmount,

          couponCode,
          couponApplied,

          holdExpiresAt: new Date(
  Date.now() + 15 * 60 * 1000
),
          totalPrice: finalTotal,

          pricingBreakdown: dynamicPricing.breakdown,
          status: "pending",
          paymentStatus: "pending",
        },
      ],
      { session }
    );

    const bookingDoc = await Booking.findById(booking[0]._id)
      .populate("hotelId", "name city")
      .populate("roomId", "title").session(session)
      .populate("userId", "name email").session(session);


    await transporter.sendMail(mailOptions(bookingDoc), (err, info) => {
      if (err) {
        console.error("Error sending booking confirmation email:", err);
      } else {
        console.log("Booking confirmation email sent:", info.messageId);
      }
    });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: booking[0],
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    session.endSession();
  }
};

export const previewBookingPrice = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { checkIn, checkOut, totalGuest, couponCode } = req.query;

    if (!checkIn || !checkOut || !totalGuest) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const room = await Room.findById(roomId)
      .select("+pricePerDay +totalRooms +hotelId");

    if (!room || room.hotelId.toString() !== hotelId) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const overlappingBookings = await Booking.countDocuments({
      roomId,
      $or: [
        { status: "booked" },
        { status: "pending", holdExpiresAt: { $gt: new Date() } },
      ],
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    });

    const occupancyRate =
      room.totalRooms > 0 ? overlappingBookings / room.totalRooms : 0;


    const dynamicPricing = await calculateDynamicPrice({
      basePrice: room.pricePerDay,
      checkIn: start,
      checkOut: end,
      hotelId,
      occupancyRate,
    });

    const pricing = calculateFinalPrice({
      pricePerDay: dynamicPricing.pricePerDay,
      nights,
    });


    let subtotal = pricing.subtotal;

    let specialOfferPercent = 0;
    let specialOfferAmount = 0;
    let couponDiscount = 0;


    const offer = await getSpecialOfferForHotel(hotelId);
    if (offer) {
      if (offer.discountType === "PERCENTAGE") {
        specialOfferPercent = offer.discountValue;
        specialOfferAmount = Math.round(
          (subtotal * specialOfferPercent) / 100
        );
      } else if (offer.discountType === "FLAT") {
        specialOfferPercent = 0;
        specialOfferAmount = Math.min(offer.discountValue, subtotal);
      }
      subtotal -= specialOfferAmount;
    }


    let couponCodeApplied = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() },
      });

      if (
        coupon &&
        (coupon.usedCount || 0) < coupon.usageLimit &&
        subtotal >= coupon.minimumBookingAmount
      ) {
        couponDiscount = calculateCouponDiscount(coupon, subtotal);
        subtotal -= couponDiscount;
        couponCodeApplied = coupon.code;
      }
    }


    const gstAmount = Math.round(subtotal * 0.12);
    const totalPrice = subtotal + gstAmount + pricing.serviceFee;

    return res.status(200).json({
      success: true,
      pricing: {
        ...pricing,
        subtotal,
        gstAmount,
        totalPrice,
        specialOfferPercent,
        specialOfferAmount,
        couponDiscount,
        couponCode: couponDiscount > 0 ? couponCodeApplied : null,
      },
    });

  } catch (error) {
    console.error("Price preview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate price",
    });
  }
};


export const confirmBooking = async (req, res) => {

  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking id must be provide" })
    }


    const booking = await Booking.findById(bookingId);


    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }


    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to confirm this booking",
      });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (booking.checkOut < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking already expired"
      });
    }


    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking already ${booking.status}`,
      });
    }



    const roomId = booking.roomId?._id ?? booking.roomId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Rooms not found",
      });
    }

    const overlappingBookings = await Booking.countDocuments({
      roomId: roomId,
      status: "booked",
      checkIn: { $lt: booking.checkOut },
      checkOut: { $gt: booking.checkIn },
    });

    if (overlappingBookings >= room.totalRooms) {
      return res.status(400).json({
        success: false,
        message: "Room no longer available",
      });
    }


    booking.status = "booked";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      booking,
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId,
    });

    const payment = await Payment.findOne({ userId, bookingId })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({
        success: false,
        message: "Booking already canceled",
      });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (booking.checkOut < now) {
      return res.status(400).json({
        success: false,
        message: "Booking already completed, cannot cancel",
      });
    }


    if (new Date(booking.checkIn) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking already started, cannot cancel",
      });
    }

    let refundAmount = 0;
    let refundMessage = "No refund";

    if (booking.status === "pending") {
      refundAmount = payment.amount;
      refundMessage = "Full refund (pending booking)";
    }

    if (booking.status === "booked") {
      const hoursBeforeCheckIn =
        (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);

      if (hoursBeforeCheckIn >= 24 && payment.paymentMode === 'COD') {
        refundAmount = 0;
        refundMessage = "No refund";
      }

      if (hoursBeforeCheckIn >= 24) {
        refundAmount = payment.amount;
        refundMessage = "Full refund (canceled before 24 hours)";
      } else {
        refundAmount = 0;
        refundMessage = "No refund (late cancellation)";
      }
    }

    booking.status = "canceled";
    booking.paymentStatus = "success";
    await booking.save();
    await autoPromoteWaitlist();

    return res.status(200).json({
      success: true,
      message: `Booking canceled successfully ,Your ${refundAmount} will be refunded in your account within 24 hours`,
      refundAmount,
      refundMessage,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getMyBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;


    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required"
      });
    }


    const booking = await Booking.findOne({
      _id: bookingId,
      userId
    })
      .populate("hotelId", "name city address")
      .populate("roomId", "title roomType pricePerDay images");


    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      booking
    });

  } catch (error) {
    console.error("Fetching booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    const bookings = await Booking.find({ userId })
      .populate("hotelId", "name city")
      .populate("roomId", "title roomType pricePerDay")
      .sort({ checkIn: -1 });


    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error("Fetching all bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getAllBookingsForHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const user = req.user;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;


    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required"
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }


    if (user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only hotel owners can access bookings"
      });
    }


    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: user._id
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You do not own this hotel"
      });
    }

    const { search } = req.query;
    let query = { hotelId };

    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: "i" }
      }).select("_id");
      const userIds = users.map((u) => u._id);

      query.$or = [
        { userId: { $in: userIds } },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or.push({ _id: search });
      }
    }

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit);

    const bookings = await Booking.find(query)
      .populate("userId", "name email")
      .populate("roomId", "title roomType pricePerDay")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return res.status(200).json({
      success: true,
      message: "Hotel bookings fetched successfully",
      count: bookings.length,
      totalBookings,
      totalPages,
      currentPage: page,
      bookings
    });

  } catch (error) {
    console.error("Fetch hotel bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized! Please login"
      });
    }

    const { hotelId, roomId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!hotelId || !roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "hotelId, roomId, checkIn and checkOut are required"
      });
    }

    const room = await Room.findOne({ _id: roomId, hotelId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found for this hotel"
      });
    }

    const bookedCount = await Booking.countDocuments({
      hotelId,
      roomId,
      $or: [
        { status: "booked" },
        { status: "pending", holdExpiresAt: { $gt: new Date() } },
      ],
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    });

    if (bookedCount >= room.totalRooms) {
      return res.status(200).json({
        success: false,
        message: "No rooms available for selected dates"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Room available",
      availableRooms: room.totalRooms - bookedCount
    });

  } catch (error) {
    console.error("checkRoomAvailability error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!["pending", "confirm", "canceled"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (paymentStatus === "confirm") {
      booking.paymentStatus = "success";
      booking.status = "booked";

      // Synchronize with Payment collection
      let payment = await Payment.findOne({ bookingId });
      if (payment) {
        payment.paymentStatus = "success";
        await payment.save();
      } else {
        await Payment.create({
          userId: booking.userId,
          bookingId: booking._id,
          amount: booking.totalPrice,
          paymentMode: booking.paymentMode || "COD",
          paymentStatus: "success",
        });
      }
    } else {
      booking.paymentStatus = paymentStatus;
      if (paymentStatus === "canceled") {
        booking.status = "canceled";

        let payment = await Payment.findOne({ bookingId });
        if (payment) {
          payment.paymentStatus = "canceled";
          await payment.save();
        }
      }
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      booking,
    });

  } catch (error) {
    console.error("Update payment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPastBooking = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const pastBookings = await Booking.find({
      userId,
      status: { $in: ["completed", "canceled"] }
    })
      .sort({ createdAt: -1 })
      .populate("hotelId", "name city")
      .populate("roomId", "roomType pricePerDay")
      ;

    return res.status(200).json({
      success: true,
      message: "Past bookings fetched successfully",
      pastBookings
    });

  } catch (error) {
    console.error("get user past booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const autoCancelledPendingBooking = async () => {
  try {
    const TIME_LIMIT = 15 * 60 * 1000;
    const expiryTime = new Date(Date.now() - TIME_LIMIT);

    const result = await Booking.updateMany(
  {
    status: "pending",
    paymentStatus: "pending",
    holdExpiresAt: {
      $lt: new Date()
    }
  },
  {
    $set: {
      status: "canceled",
      paymentStatus: "canceled"
    }
  }
);
    console.log(`Auto-cancelled ${result.modifiedCount} pending bookings`);
  } catch (error) {
    console.error("Auto cancel pending booking error:", error);
  }
};
export const getUpcomingBooking = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBookings = await Booking.find({
      userId,
      checkIn: { $gte: today },
      status: { $ne: "canceled" },
      paymentStatus: "success"
    })
      .sort({ checkIn: 1 }).populate('hotelId', 'name city').populate('roomId', 'title');

    return res.status(200).json({
      success: true,
      message: "Upcoming bookings fetched successfully",
      upcomingBookings
    });

  } catch (error) {
    console.error("get upcoming booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  booking.paymentStatus = "success";
  await booking.save();

  res.status(200).json({
    success: true,
    message: "Payment verified",
  });
};

export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;


    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }


    if (!booking.userId.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this booking",
      });
    }



    if (!["canceled", "completed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Only past or cancelled bookings can be deleted",
      });
    }


    await booking.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });

  } catch (error) {
    console.error("Delete booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete booking",
    });
  }
}


export const getSpecialOfferForHotel = async (hotelId) => {
  // Check if there is an active, valid coupon specifically for this hotel first
  const today = new Date();
  const coupon = await Coupon.findOne({
    hotelId: hotelId,
    isActive: true,
    expiryDate: { $gte: today },
  })
    .select("discountType discountValue usedCount usageLimit")
    .lean();

  if (coupon && (coupon.usedCount || 0) < coupon.usageLimit) {
    return {
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
  }

  return null;
};


export const autoCompleteBooking = async () => {
  try {
    const count = await bookingService.autoCompleteBookings();
    if (count > 0) console.log(`Auto-completed ${count} booking(s)`);
  } catch (error) {
    console.error("Auto-complete booking error:", error);
  }
};