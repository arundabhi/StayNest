import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import uploadCloudinary from "../utils/cloudinary.utils.js";

export const createRoom = async (req, res) => {
  try {

    const userId = req.userId;        
    const hotelId = req.params.hotelId;

    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: userId
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You are not the owner of this hotel"
      });
    }

    const {
      title,
      pricePerDay,
      totalRooms,
      maxGuests,
      roomType,
    } = req.body;


    if (!title || !pricePerDay || !totalRooms || !maxGuests || !roomType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }


    let amenities = req.body.amenities;

    if (!amenities) {
      amenities = [];
    } else if (!Array.isArray(amenities)) {
      amenities = [amenities];
    }

    if (amenities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one amenity is required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const images = [];
    for (const image of req.files) {
      const result = await uploadCloudinary(image.buffer);
      images.push(result.secure_url);
    }


    const room = await Room.create({
      hotelId,
      title,
      maxGuests,
      roomType,
      amenities,
      images,
      totalRooms,
      pricePerDay,
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });

  } catch (error) {
    console.error("Create room error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    const {
      title,
      pricePerDay,
      totalRooms,
      maxGuests,
      roomType,
      amenities
    } = req.body;


    if (
      !title &&
      !pricePerDay &&
      !totalRooms &&
      !maxGuests &&
      !roomType &&
      !amenities
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }


    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: userId,
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this room",
      });
    }


    const room = await Room.findOne({
      _id: roomId,
      hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found for this hotel",
      });
    }


    let normalizedAmenities;
    if (amenities) {
      normalizedAmenities = Array.isArray(amenities)
        ? amenities
        : [amenities];
    }


    const updates = {};
    if (title) updates.title = title;
    if (pricePerDay) updates.pricePerDay = pricePerDay;
    if (totalRooms) updates.totalRooms = totalRooms;
    if (maxGuests) updates.maxGuests = maxGuests;
    if (roomType) updates.roomType = roomType;
    if (normalizedAmenities) updates.amenities = normalizedAmenities;


    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $set: updates },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });

  } catch (error) {
    console.error("Update room error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; 

export const updateRoomImages = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    // ✅ Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // ✅ Ownership check
    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: userId,
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update images",
      });
    }

    // ✅ Check room belongs to hotel
    const room = await Room.findOne({
      _id: roomId,
      hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // ✅ Upload images (parallel)
    const images = await Promise.all(
      req.files.map(file =>
        uploadCloudinary(file.buffer).then(res => res.secure_url)
      )
    );

    // ✅ Update images (REPLACE)
    room.images = images;
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room images updated successfully",
      images: room.images,
    });

  } catch (error) {
    console.error("Update room images error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    // ✅ Ownership check
    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: userId,
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this room",
      });
    }

    // ✅ Ensure room belongs to hotel
    const room = await Room.findOne({
      _id: roomId,
      hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // ❗ Optional: Prevent deletion if bookings exist

    const hasBookings = await Booking.exists({ roomId });
    if (hasBookings) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete room with active bookings",
      });
    }
  
    await room.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });

  } catch (error) {
    console.error("Delete room error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRoomsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const { page = 1, limit = 10 } = req.query;

const rooms = await Room.find({ hotelId })
  .skip((page - 1) * limit)
  .limit(Number(limit));


    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No rooms found for this hotel",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      rooms,
    });

  } catch (error) {
    console.error("Fetch rooms error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Optional: validate MongoDB ObjectId
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Room fetched successfully",
      room,
    });

  } catch (error) {
    console.error("Fetch room error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const toggleRoomAvailability = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    if (!hotelId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "hotelId and roomId are required",
      });
    }

    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: userId,
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this room",
      });
    }

    const room = await Room.findOne({
      _id: roomId,
      hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.isAvailable = !room.isAvailable;
    await room.save();

    return res.status(200).json({
      success: true,
      message: `Room is now ${room.isAvailable ? "available" : "unavailable"}`,
      isAvailable: room.isAvailable,
    });

  } catch (error) {
    console.error("Toggle availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "checkIn and checkOut dates are required",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // 🔒 Owner-disabled room
    if (!room.isAvailable) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Room is disabled by owner",
      });
    }

    const bookedCount = await Booking.countDocuments({
      roomId,
      status: "confirmed",
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) },
        },
      ],
    });

    const availableRooms = room.totalRooms - bookedCount;

    return res.status(200).json({
      success: true,
      available: availableRooms > 0,
      availableRooms,
      totalRooms: room.totalRooms,
    });

  } catch (error) {
    console.error("Check availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const searchRooms = async (req, res) => {
  try {
    const { hotelId, maxGuests, minPrice, maxPrice } = req.query;

    // 🔒 Validate hotelId
    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "Valid hotelId is required",
      });
    }

    const query = {
      hotelId,
      isAvailable: true,
    };

    // 👥 Guests filter
    if (maxGuests) {
      query.maxGuests = { $gte: Number(maxGuests) };
    }

    // 💰 Price filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const rooms = await Room.find(query);

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Search rooms error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getRoomStats = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    // 🔐 Ownership check
    const hotel = await Hotel.findOne({
      _id: hotelId,
      owner: userId,
    });

    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view room stats",
      });
    }

    // 🏨 Room validation
    const room = await Room.findOne({
      _id: roomId,
      hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // 📊 Booking stats
    const totalBookings = await Booking.countDocuments({ roomId });

    const confirmedBookings = await Booking.countDocuments({
      roomId,
      status: "confirmed",
    });

    const cancelledBookings = await Booking.countDocuments({
      roomId,
      status: "cancelled",
    });

    // 💰 Revenue
    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          roomId: room._id,
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // 📅 Last booking
    const lastBooking = await Booking.findOne({ roomId })
      .sort({ createdAt: -1 })
      .select("createdAt");

    // 📈 Occupancy rate (simple version)
    const occupancyRate =
      room.totalRooms > 0
        ? ((confirmedBookings / room.totalRooms) * 100).toFixed(2)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        roomId,
        roomType: room.roomType,
        totalRooms: room.totalRooms,

        totalBookings,
        confirmedBookings,
        cancelledBookings,

        totalRevenue,
        occupancyRate: `${occupancyRate}%`,
        lastBookingAt: lastBooking?.createdAt || null,
      },
    });

  } catch (error) {
    console.error("Room stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};