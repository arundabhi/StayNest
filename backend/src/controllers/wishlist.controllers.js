import { Room } from "../models/room.models.js";
import { Wishlist } from "../models/wishlist.models.js"

export const addToWishlist = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!hotelId && !roomId) {
      return res.status(400).json({
        success: false,
        message: "Hotel id or Room id must be provided",
      });
    }

    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
  
      if (hotelId && room.hotelId.toString() !== hotelId) {
        return res.status(400).json({
          success: false,
          message: "Room does not belong to this hotel",
        });
      }
    }

    const wishlist = await Wishlist.create({
      userId,
      hotelId,
      roomId,
    });

    await wishlist.populate("roomId");

    return res.status(201).json({
      success: true,
      message: "Added to wishlist successfully",
      wishlist,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already added to wishlist",
      });
    }

    console.error("Add to wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { wishlistId } = req.params;
    const userId = req.userId;

   
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!wishlistId) {
      return res.status(400).json({
        success: false,
        message: "Wishlist id is required",
      });
    }


    const wishlist = await Wishlist.findById(wishlistId);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found",
      });
    }


    if (!wishlist.userId.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to remove this wishlist item",
      });
    }

    await wishlist.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist successfully",
    });

  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const wishlist = await Wishlist.find({ userId })
      .populate("hotelId", "name city basePrice")
      .populate("roomId", "title pricePerDay images")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });

  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { roomId, hotelId } = req.body; // ✅ BODY, not params

    if (!userId || (!roomId && !hotelId)) {
      return res.status(400).json({
        success: false,
        message: "UserId and HotelId or RoomId required",
      });
    }

    let finalHotelId = hotelId;
    let finalRoomId = null;

    // 🛏️ If roomId is provided → derive hotelId
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
      finalRoomId = room._id;
      finalHotelId = room.hotelId;
    }

    // 🏨 If hotelId only → validate hotel
    if (!finalHotelId) {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }
    }

    // 🔁 Toggle by user + hotel (NOT room)
    const existing = await Wishlist.findOne({
      userId,
      hotelId: finalHotelId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({
        success: true,
        wished: false,
        message: "Removed from wishlist",
      });
    }

    await Wishlist.create({
      userId,
      hotelId: finalHotelId,
      roomId: finalRoomId,
    });

    return res.status(201).json({
      success: true,
      wished: true,
      message: "Added to wishlist",
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already in wishlist",
      });
    }

    console.error("Toggle wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const isWishlisted = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId, roomId } = req.params;

    // 🔐 Not logged in → NOT an error for wishlist check
    if (!userId) {
      return res.status(401).json({
        success: false,
        wishlisted: false,
      });
    }

    // ❌ Neither hotelId nor roomId provided
    if (!hotelId && !roomId) {
      return res.status(400).json({
        success: false,
        message: "HotelId or RoomId required",
      });
    }

    const query = { userId };

    if (hotelId) query.hotelId = hotelId;
    if (roomId) query.roomId = roomId;

    const exists = await Wishlist.exists(query);

    return res.status(200).json({
      success: true,
      wishlisted: Boolean(exists),
    });
  } catch (error) {
    console.error("Wishlist check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Wishlist.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Wishlist count error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
