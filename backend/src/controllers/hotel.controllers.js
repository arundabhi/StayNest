import { Hotel } from "../models/hotel.models.js";
import uploadCloudinary from "../utils/cloudinary.utils.js";

export const registerHotel = async (req, res) => {
  try {
    let { name, description, address, city, state, basePrice } = req.body;

    if (!name || !address || !city || !basePrice) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // ✅ OWNER ID FROM TOKEN
    const ownerId = req.userId;

    // 🔥 IMPORTANT: CHECK IF OWNER ALREADY HAS A HOTEL
    const existingHotel = await Hotel.findOne({ owner: ownerId });

    if (existingHotel) {
      return res.status(409).json({
        success: false,
        message: "This owner already has a registered hotel",
      });
    }

    // Amenities handling
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

    // Images upload
    const images = [];
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    for (const file of req.files) {
      const result = await uploadCloudinary(file.buffer);
      images.push(result.secure_url);
    }

    // Create hotel
    const hotel = await Hotel.create({
      owner: ownerId,
      name,
      description,
      address,
      city,
      state,
      basePrice,
      amenities,
      images,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    return res.status(201).json({
      success: true,
      message: "Hotel registered successfully",
      hotel,
    });
  } catch (error) {
    console.error("Register hotel error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateHotel = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      mobileNumber,
      basePrice,
      description,
    } = req.body;

  
    if (
      !name &&
      !address &&
      !city &&
      !state &&
      !mobileNumber &&
      !basePrice &&
      !description &&
      !req.body.amenities &&
      (!req.files || req.files.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }


    let amenities = req.body.amenities;
    if (!amenities) {
      amenities = undefined;
    } else if (!Array.isArray(amenities)) {
      amenities = [amenities];
    }





    const updateData = {
      ...(name && { name }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(mobileNumber && { mobileNumber }),
      ...(basePrice && { basePrice }),
      ...(description && { description }),
      ...(amenities && { amenities })
    };

    const hotel = await Hotel.findOneAndUpdate(
      { owner: req.userId }, 
      updateData,
      { new: true,runValidators: true  }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      hotel,
    });

  } catch (error) {
    console.error("Update hotel error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findOneAndDelete({
      _id: hotelId,
      owner: req.userId,
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });

  } catch (error) {
    console.error("Delete hotel error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel fetched successfully",
      hotel,
    });

  } catch (error) {
    console.error("Get hotel by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const searchHotel = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    const hotels = await Hotel.find({
      $or: [
        { name: { $regex: name, $options: "i" } },
        { city: { $regex: name, $options: "i" } },
        { state: { $regex: name, $options: "i" } },
      ],
    });

    if (hotels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hotels found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotels fetched successfully",
      hotels,
    });
  } catch (error) {
    console.error("Search hotel error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getMyHotel = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.userId });

    if (hotels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hotels found for this account",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotels fetched successfully",
      hotels,
    });

  } catch (error) {
    console.error("Get my hotels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const toggleHotelState = async (req, res) => {
  try {
  
    const hotel = await Hotel.findOneAndUpdate(
  { owner: req.userId },
  [{ $set: { isActive: { $not: "$isActive" } } }],
  { new: true }
);


    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Hotel is now ${hotel.isActive ? "active" : "inactive"}`,
      hotel,
    });

  } catch (error) {
    console.error("Toggle hotel state error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getAllHotels = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };

    if (city) filter.city = { $regex: city, $options: "i" };
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const hotels = await Hotel.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({ success: true, hotels });

  } catch (error) {
    return res.status(500).json({ success:false, message:"Server error" });
  }
};


export const getNearbyHotels = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    const hotels = await Hotel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 5000, // 5km
        },
      },
      isActive: true,
    });

    return res.status(200).json({ success:true, hotels });

  } catch (error) {
    return res.status(500).json({ success:false, message:"Server error" });
  }
};


export const addHotelImages = async (req, res) => {
  try {
    const urls = [];
    for (const file of req.files) {
      const result = await uploadCloudinary(file.buffer);
      urls.push(result.secure_url);
    }

    const hotel = await Hotel.findOneAndUpdate(
      { owner: req.userId },
      { $push: { images: { $each: urls } } },
      { new: true }
    );

    return res.status(200).json({ success:true, hotel });

  } catch (error) {
    return res.status(500).json({ success:false, message:"Server error" });
  }
};


export const getHotelStats = async (req, res) => {
  const hotel = await Hotel.findOne({ owner: req.userId });

  res.json({
    success: true,
    stats: {
      totalRooms: hotel.rooms?.length || 0,
      isActive: hotel.isActive,
      amenitiesCount: hotel.amenities.length,
    },
  });
};


export const removeHotelImage = async (req, res) => {
  const { imageUrl } = req.body;

  const hotel = await Hotel.findOneAndUpdate(
    { owner: req.userId },
    { $pull: { images: imageUrl } },
    { new: true }
  );

  res.json({ success:true, hotel });
};
