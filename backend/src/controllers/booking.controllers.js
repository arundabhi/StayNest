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
import transporter from "../utils/sendEmail.utils.js";

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
      status: { $in: ["pending", "booked"] },
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
      specialOfferPercent = offer.discountPercent;
      specialOfferAmount = Math.round(
        (subtotal * specialOfferPercent) / 100
      );
      subtotal -= specialOfferAmount;
    }


    let couponDiscount = 0;

    if (couponCodeFromClient) {
      const coupon = await Coupon.findOne({
        code: couponCodeFromClient,
        isActive: true,
      }).session(session);

      if (!coupon) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid or expired coupon",
        });
      }


      couponDiscount = calculateCouponDiscount(coupon, subtotal);
      subtotal -= couponDiscount;
      couponApplied = couponDiscount > 0;
      couponCode = coupon.code;
    }


    const gstAmount = Math.round(subtotal * 0.12);
    const serviceFee = pricing.serviceFee;

    const finalTotal = subtotal + gstAmount + serviceFee;

    const discountAmount = specialOfferAmount + couponDiscount;

    const booking = await Booking.create(
      [
        {
          userId,
          hotelId,
          roomId,
          checkIn: start,
          checkOut: end,
          totalGuest,
          paymentMode,

          pricePerNight: pricePerDay,

          basePrice: pricing.subtotal + discountAmount,
          discountAmount,

          specialOfferPercent,
          specialOfferAmount,

          couponCode,
          couponApplied,


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
      .populate("roomId", "title").session(session);;



    const mailOptions = {
      from: `"Hotel Booking" <${process.env.SENDER_EMAIL}>`,
      to: req.user.email,
      subject: "✅ Booking Confirmed | Your Stay Details",
      html: `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:30px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:#0d6efd; padding:20px; text-align:center; color:#ffffff;">
        <h1 style="margin:0;">🏨 Booking Confirmed</h1>
        <p style="margin:5px 0 0;">We look forward to hosting you</p>
      </div>

      <!-- Body -->
      <div style="padding:25px; color:#333;">
        <p>Hi <strong>${req.user.name}</strong>,</p>

        <p>Thank you for your booking! Your reservation has been successfully created. Below are your booking details:</p>

        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; margin-top:15px;">
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Booking ID</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?._id}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Hotel</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.hotelId.name}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Room Type</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.roomId.title}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Location</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.hotelId.city}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Check-in</strong></td>
            <td style="border-bottom:1px solid #eee;">${start.toDateString()}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Check-out</strong></td>
            <td style="border-bottom:1px solid #eee;">${end.toDateString()}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Guests</strong></td>
            <td style="border-bottom:1px solid #eee;">${totalGuest}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Payment Mode</strong></td>
            <td style="border-bottom:1px solid #eee;">${paymentMode}</td>
          </tr>
          <tr>
            <td style="font-size:16px;"><strong>Total Amount</strong></td>
            <td style="font-size:16px; color:#0d6efd;"><strong>₹${finalTotal}</strong></td>
          </tr>
        </table>

        <p style="margin-top:20px;">
          If you need to modify or cancel your booking, please contact our support team.
        </p>

        <p>We wish you a comfortable and pleasant stay! 🌟</p>

        <p style="margin-top:25px;">
          Regards,<br/>
          <strong>Hotel Booking Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f1f3f5; padding:15px; text-align:center; font-size:12px; color:#777;">
        <p style="margin:0;">This is an automated email. Please do not reply.</p>
      </div>

    </div>
  </div>
  `
    };

    await transporter.sendMail(mailOptions);

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
      status: { $in: ["pending", "booked"] },
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
      specialOfferPercent = offer.discountPercent;
      specialOfferAmount = Math.round(
        (subtotal * specialOfferPercent) / 100
      );
      subtotal -= specialOfferAmount;
    }


    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
      });

      if (coupon) {
        couponDiscount = calculateCouponDiscount(coupon, subtotal);
        subtotal -= couponDiscount;
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
        couponCode: couponDiscount > 0 ? couponCode : null,
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

    const bookings = await Booking.find({ hotelId })
      .populate("userId", "name email")
      .populate("roomId", "title roomType pricePerDay")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Hotel bookings fetched successfully",
      count: bookings.length,
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
      status: "booked",
      $or: [
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
        }
      ]
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

    booking.paymentStatus = paymentStatus;

    if (paymentStatus === "confirm") {
      booking.status = "booked";
    }

    if (paymentStatus === "canceled") {
      booking.status = "canceled";
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
        paymentStatus: "pending",
        status: "pending",
        createdAt: { $lt: expiryTime }
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



// export const getBookingStats = async (req, res) => {
//   try {
//     const userId = req.userId;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const today = new Date().toISOString().split("T")[0];

//     const totalBookings = await Booking.countDocuments({ userId });

//     const upcomingBookings = await Booking.countDocuments({
//       userId,
//       checkIn: { $gte: today },
//       status: { $ne: "canceled" },
//       paymentStatus: "confirm"
//     });

//     const pastBookings = await Booking.countDocuments({
//       userId,
//       checkOut: { $lt: today }
//     });

//     const canceledBookings = await Booking.countDocuments({
//       userId,
//       status: "canceled"
//     });

//     const pendingPayments = await Booking.countDocuments({
//       userId,
//       paymentStatus: "pending"
//     });

//     return res.status(200).json({
//       success: true,
//       stats: {
//         totalBookings,
//         upcomingBookings,
//         pastBookings,
//         canceledBookings,
//         pendingPayments
//       }
//     });

//   } catch (error) {
//     console.error("get booking stats error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };

// export const getHotelRevenue = async (req, res) => {
//   try {
//     const { hotelId } = req.params;

//     if (!hotelId) {
//       return res.status(400).json({
//         success: false,
//         message: "Hotel ID is required"
//       });
//     }

//     const revenue = await Booking.aggregate([
//       {
//         $match: {
//           hotelId: new mongoose.Types.ObjectId(hotelId),
//           paymentStatus: "confirm",
//           status: { $ne: "canceled" }
//         }
//       },
//       {
//         $group: {
//           _id: "$hotelId",
//           totalRevenue: { $sum: "$totalPrice" },
//           totalBookings: { $sum: 1 }
//         }
//       }
//     ]);

//     return res.status(200).json({
//       success: true,
//       revenue: revenue[0] || {
//         totalRevenue: 0,
//         totalBookings: 0
//       }
//     });

//   } catch (error) {
//     console.error("get hotel revenue error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };


// export const getMonthlyHotelRevenue = async (req, res) => {
//   try {
//     const { hotelId } = req.params;

//     const revenue = await Booking.aggregate([
//       {
//         $match: {
//           hotelId: new mongoose.Types.ObjectId(hotelId),
//           paymentStatus: "confirm"
//         }
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" }
//           },
//           totalRevenue: { $sum: "$totalPrice" }
//         }
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } }
//     ]);

//     return res.status(200).json({ success: true, revenue });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };





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
  const rooms = await Room.find({ hotelId });

  if (!rooms.length) return null;

  let totalCapacity = 0;
  let bookedRooms = 0;

  for (const room of rooms) {
    totalCapacity += room.totalRooms;

    const booked = await Booking.countDocuments({
      roomId: room._id,
      status: "booked",
      checkIn: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    bookedRooms += booked;
  }

  const occupancyRate =
    totalCapacity > 0 ? bookedRooms / totalCapacity : 0;

  let discountPercent = 0;

  if (occupancyRate < 0.3) discountPercent = 30;
  else if (occupancyRate < 0.5) discountPercent = 20;
  else if (occupancyRate < 0.7) discountPercent = 10;

  if (discountPercent === 0) return null;

  return { discountPercent };
};


export const autoCompleteBooking = async () => {
  try {
    const now = new Date();


    now.setSeconds(0, 0);

    const bookingsToComplete = await Booking.find({
      status: "booked",
      checkOut: { $lt: now },
      paymentStatus: { $in: ["success"] },
    });

    if (bookingsToComplete.length === 0) {
      console.log(" No bookings to auto-complete");
      return;
    }

    const bookingIds = bookingsToComplete.map((b) => b._id);

    const result = await Booking.updateMany(
      { _id: { $in: bookingIds } },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
        },
      }
    );

    console.log(
      ` Auto-completed ${result.modifiedCount} booking(s)`
    );
  } catch (error) {
    console.error("Auto-complete booking error:", error);
  }
};