import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { calculateDynamicPrice } from "../utils/calculateDynamicPrice.utils.js";
import mongoose from "mongoose";
import { autoPromoteWaitlist } from "./waitlist.controllers.js";

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const { checkIn, checkOut, totalGuest, paymentMode } = req.body;
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: "Please login to book a room",
      });
    }

    if (!hotelId || !roomId || !checkIn || !checkOut || !totalGuest || !paymentMode) {
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

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid booking duration",
      });
    }

   
    const room = await Room.findById(roomId)
      .session(session)
      .select('+totalRooms +maxGuests +pricePerDay +hotelId +isAvailable');

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
      status: { $in: ['booked', 'pending'] }, 
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

    const occupancyRate = overlappingBookings / room.totalRooms;

    
    const dynamicPricePerDay = await calculateDynamicPrice({
      basePrice: room.pricePerDay,
      checkIn: start,
      checkOut: end,
      hotelId,
      occupancyRate,
    });

    const totalPrice = dynamicPricePerDay * diffDays;

   
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
          totalPrice,
          status: "pending",
          paymentStatus: "pending",
        },
      ],
      { session }
    );

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

    if(!bookingId){
      return res.status(400).json({success:false,message:"Booking id must be provide"})
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
    // find room
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
    await autoPromoteWaitlist();

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
    const TIME_LIMIT = 15 * 60 * 1000; //15 minit 
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

    const today = new Date().toISOString().split("T")[0];

    const upcomingBookings = await Booking.find({
      userId,
      checkIn: { $gte: today },
      status: { $ne: "canceled" },
      paymentStatus: "confirm"
    })
    .sort({ checkIn: 1 });

    if (upcomingBookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No upcoming bookings",
        upcomingBookings: []
      });
    }

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


export const autoCompleteBooking = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Booking.updateMany(
      {
        status: "booked",
        checkOut: { $lt: today }
      },
      {
        $set: { status: "completed" }
      }
    );
    if (result.modifiedCount > 0) {
    await autoPromoteWaitlist();
  }

    console.log(`Auto-completed ${result.modifiedCount} bookings`);
  } catch (error) {
    console.error("Auto complete booking error:", error);
  }
};


export const verifyPayment = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  booking.paymentStatus = "confirm";
  await booking.save();

  res.status(200).json({
    success: true,
    message: "Payment verified",
  });
};


