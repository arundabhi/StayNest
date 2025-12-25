import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { Waitlist } from "../models/waitlist.model.js";

export const addToWaitlist = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room id is required",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    const activeBookings = await Booking.countDocuments({
      roomId,
      status: { $in: ["pending", "booked"] },
    });

 
    if (activeBookings < room.totalRooms) {
      return res.status(400).json({
        success: false,
        message: "Room is available, waitlist not required",
      });
    }

  
    const alreadyWaitlisted = await Waitlist.findOne({
      userId,
      roomId,
      status: "waiting",
    });

    if (alreadyWaitlisted) {
      return res.status(400).json({
        success: false,
        message: "Already in waitlist",
      });
    }

    const waitlistEntry = await Waitlist.create({
      userId,
      hotelId: room.hotelId,
      roomId,
      status: "waiting",
    });

    return res.status(201).json({
      success: true,
      message: "Added to waitlist successfully",
      waitlist: waitlistEntry,
    });

  } catch (error) {
    console.error("Add to waitlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserWaitlist = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const waitlists = await Waitlist.find({ userId })
      .populate("roomId")
      .populate("hotelId");

    if (!waitlists || waitlists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You have no waitlist bookings",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User waitlist found",
      waitlists,
    });

  } catch (error) {
    console.error("Get user waitlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRoomWaitlist = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room id is required",
      });
    }
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const hotel = await Hotel.findById(room.hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (hotel.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this waitlist",
      });
    }

    const waitlists = await Waitlist.find({
      roomId,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .populate("userId", "name email")
      .populate("hotelId", "name");

    return res.status(200).json({
      success: true,
      message: "Room waitlist fetched successfully",
      count: waitlists.length,
      waitlists,
    });

  } catch (error) {
    console.error("Get room waitlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const promoteWaitlistBooking = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room id is required",
      });
    }


    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }


    const activeBookings = await Booking.countDocuments({
      roomId,
      status: { $in: ["pending", "booked"] },
    });

    if (activeBookings >= room.totalRooms) {
      return res.status(400).json({
        success: false,
        message: "No rooms available to promote waitlist",
      });
    }

 
    const waitlist = await Waitlist.findOne({
      roomId,
      status: "waiting",
    }).sort({ createdAt: 1 });

    if (!waitlist) {
      return res.status(404).json({
        success: false,
        message: "No waitlist users found",
      });
    }

   
    const existingBooking = await Booking.findOne({
      userId: waitlist.userId,
      roomId,
      status: { $in: ["pending", "booked"] },
    });

    if (existingBooking) {
      waitlist.status = "expired";
      await waitlist.save();

      return res.status(400).json({
        success: false,
        message: "User already has an active booking",
      });
    }


    const booking = await Booking.create({
      userId: waitlist.userId,
      hotelId: waitlist.hotelId,
      roomId,
      checkIn: waitlist.checkIn,
      checkOut: waitlist.checkOut,
      totalGuest: waitlist.totalGuest,
      status: "pending",
      paymentStatus: "pending",
      paymentMode: "cod",
    });


    waitlist.status = "promoted";
    await waitlist.save();

    return res.status(200).json({
      success: true,
      message: "Waitlist user promoted successfully",
      booking,
    });

  } catch (error) {
    console.error("Promote waitlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const autoPromoteWaitlist = async () => {
  try {
    await expireWaitlistEntries();
    const waitlistRooms = await Waitlist.distinct("roomId", {
      status: "waiting",
    });

    for (const roomId of waitlistRooms) {
      const room = await Room.findById(roomId);
      if (!room) continue;


      const activeBookings = await Booking.countDocuments({
        roomId,
        status: { $in: ["pending", "booked"] },
      });

      if (activeBookings >= room.totalRooms) continue;

      const waitlist = await Waitlist.findOne({
        roomId,
        status: "waiting",
      }).sort({ createdAt: 1 });

      if (!waitlist) continue;

 
      const alreadyBooked = await Booking.findOne({
        userId: waitlist.userId,
        roomId,
        status: { $in: ["pending", "booked"] },
      });

      if (alreadyBooked) {
        waitlist.status = "expired";
        await waitlist.save();
        continue;
      }

      await Booking.create({
        userId: waitlist.userId,
        hotelId: waitlist.hotelId,
        roomId: waitlist.roomId,
        checkIn: waitlist.checkIn,
        checkOut: waitlist.checkOut,
        totalGuest: waitlist.totalGuest,
        status: "pending",
        paymentStatus: "pending",
        paymentMode: "online",
      });


      waitlist.status = "promoted";
      await waitlist.save();

      console.log(`✅ Auto-promoted waitlist for room ${roomId}`);
    }
  } catch (error) {
    console.error("Auto promote waitlist error:", error);
  }
};
export const removeFromWaitlist = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { waitlistId } = req.params;

    if (!waitlistId) {
      return res.status(400).json({
        success: false,
        message: "Waitlist id is required",
      });
    }

    const waitlist = await Waitlist.findById(waitlistId);

    if (!waitlist) {
      return res.status(404).json({
        success: false,
        message: "Waitlist entry not found",
      });
    }

    // Ownership check
    if (!waitlist.userId.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to remove this waitlist entry",
      });
    }

    // Only waiting entries can be removed
    if (waitlist.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Cannot remove promoted or expired waitlist entry",
      });
    }

    await waitlist.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Removed from waitlist successfully",
    });

  } catch (error) {
    console.error("Remove from waitlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const expireWaitlistEntries = async () => {
  try {
    const EXPIRY_HOURS = 24;

    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - EXPIRY_HOURS);

    const result = await Waitlist.updateMany(
      {
        status: "waiting",
        createdAt: { $lt: expiryTime },
      },
      {
        $set: { status: "expired" },
      }
    );

    console.log(
      `⏳ Expired ${result.modifiedCount} waitlist entries`
    );
  } catch (error) {
    console.error("Expire waitlist error:", error);
  }
};
