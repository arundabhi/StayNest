import { Hotel } from "../models/hotel.models.js";
import uploadCloudinary from "../utils/cloudinary.utils.js";

export const registerHotel = async (req, res) => {
  try {
    let { name, description, address, city, state, basePrice} = req.body;


    if (!name || !address || !city || !basePrice) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
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


    // 🔐 owner from JWT
    const ownerId = req.userId;

    // 🖼️ Upload images
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
        coordinates: [req.body.longitude, req.body.latitude],
      },
    });

    return res.status(201).json({
      success: true,
      message: "Hotel registered successfully",
      hotel,
    });
  } catch (error) {
    console.error("Register hotel error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
