import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { calculateDynamicPrice } from "../utils/calculateDynamicPrice.utils.js";

export const createBooking = async (req, res) => {
  try {
    const { checkIn, checkOut, totalGuest, paymentMode } = req.body;
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    //auth
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to book a room",
      });
    }

    //required fields
    if (!hotelId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "Hotel and Room are required",
      });
    }

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out dates are required",
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in",
      });
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking duration",
      });
    }

    if (!totalGuest || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Total guests and payment mode required",
      });
    }

    // roomcheck
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
    if (room.hotelId.toString() !== hotelId) {
  return res.status(400).json({
    success: false,
    message: "Room does not belong to this hotel"
  });
}


    if (room.maxGuests < totalGuest) {
      return res.status(400).json({
        success: false,
        message: "Guest count exceeds room capacity",
      });
    }

    if (!room.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Room temporarily unavailable",
      });
    }

    // dateAvailablecheck
    const overlappingBookings = await Booking.countDocuments({
      roomId,
      status: 'booked',
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    });

    if (overlappingBookings >= room.totalRooms) {
      return res.status(400).json({
        success: false,
        message: "Room not available for selected dates",
      });
    }

    const occupancyRate = overlappingBookings / room.totalRooms;

    // dynamicPrice
    const dynamicPricePerDay = await calculateDynamicPrice({
      basePrice: room.pricePerDay,
      checkIn: start,
      checkOut: end,
      hotelId,
      occupancyRate,
    });

    const totalPrice = dynamicPricePerDay * diffDays;

    //creatbook
    const booking = await Booking.create({
      userId,
      hotelId,
      roomId,
      checkIn,
      checkOut,
      totalGuest,
      paymentMode,
      totalPrice,
      status: "pending",
      paymentStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // auth
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // findBookking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ownership
    if (booking.userId.toString() !== userId) {
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

    // paymentcheck
    if (booking.paymentStatus !== "confirm") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // availability
    const room = await Room.findById(booking.roomId);

    const overlappingBookings = await Booking.countDocuments({
      roomId: booking.roomId,
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

    // cnfrm booking
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

    // ⏱️ Completed check (timezone safe)
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (booking.checkOut < now) {
      return res.status(400).json({
        success: false,
        message: "Booking already completed, cannot cancel",
      });
    }

    // 🚫 Already started
    if (new Date(booking.checkIn) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking already started, cannot cancel",
      });
    }

    let refundAmount = 0;
    let refundMessage = "No refund";

    if (booking.status === "pending") {
      refundAmount = booking.totalPrice;
      refundMessage = "Full refund (pending booking)";
    }

    if (booking.status === "booked") {
      const hoursBeforeCheckIn =
        (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);

      if (hoursBeforeCheckIn >= 24) {
        refundAmount = booking.totalPrice;
        refundMessage = "Full refund (canceled before 24 hours)";
      } else {
        refundAmount = 0;
        refundMessage = "No refund (late cancellation)";
      }
    }

    booking.status = "canceled";
    booking.paymentStatus = "canceled";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking canceled successfully",
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
      ownerId: user._id
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
      status: "confirm",
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

