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
    const { roomId } = req.params;

    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "User or Room id missing",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const existing = await Wishlist.findOne({ userId, roomId });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Removed from wishlist",
        wished: false,
      });
    }

    await Wishlist.create({
      userId,
      roomId,
      hotelId: room.hotelId,
    });

    return res.status(201).json({
      success: true,
      message: "Added to wishlist",
      wished: true,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already wishlisted",
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
    const { roomId } = req.params;

    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "Missing data",
      });
    }

    const exists = await Wishlist.exists({ userId, roomId });

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
