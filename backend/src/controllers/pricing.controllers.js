import { Hotel } from "../models/hotel.models.js";
import { Pricing } from "../models/pricing.models.js";

export const createPricing = async (req, res) => {
  try {
    const {hotelId} = req.params; 
    const {
      name,
      startDate,
      endDate,
      multiplier,
      specialOfferPercent,
      specialOfferAmount
    } = req.body;
  
    console.log(hotelId);
    
    const hotel = await Hotel.findById(hotelId);



    if (hotel.owner === req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this hotel"
      });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }
    const pricing = await Pricing.create({
      name,
      startDate,
      endDate,
      multiplier,
      hotelId,
      specialOfferPercent,
      specialOfferAmount
    });

    res.status(201).json({
      message: "Pricing rule created successfully",
      pricing
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getHotelPricing = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const ownerId = req.user._id
  
    
    const hotel = await Hotel.findById(hotelId);

    if (hotel.owner === ownerId.toString()) {
      return res.status(403).json({
        message: "Unauthorized access"
      });
    }

    const pricing = await Pricing.find({ hotelId })
      .sort({ startDate: 1 });
    if(pricing.length == 0){
      return res.status(404).json({success:false,message:"No record Found"})
    }
    res.json(pricing);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePricing = async (req, res) => {
  try {
    const { pricingId } = req.params;
    const ownerId = req.userId;
    
    
    const pricing = await Pricing.findById(pricingId);

    if (!pricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    const hotel = await Hotel.findOne(pricing.hotelId);

    if (hotel.owner === ownerId.toString()) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    const updated = await Pricing.findByIdAndUpdate(
      pricingId,
      req.body,
      { new: true }
    );

    res.json({
      message: "Pricing updated successfully",
      updated
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const showDiscountToUser = async (req,res) => {
  try {
    const { hotelId } = req.params;

    if(!hotelId){
      return res.status(400).json({
        success:false,
        message:"Hotel Id required"
      });
    }

    const pricing = await Pricing.findOne({ hotelId });

    if(!pricing){
      return res.status(404).json({
        success:false,
        message:"No Festival Offer found"
      });
    }

    const today = new Date();

    if(today > pricing.endDate){
      return res.status(400).json({
        success:false,
        message:"Expired"
      });
    }

    return res.status(200).json({
      success:true,
      message:"Festival offer available",
      pricing
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

export const deletePricing = async (req, res) => {
  try {
    const { pricingId } = req.params;

    const pricing = await Pricing.findById(pricingId);

    if (!pricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }
    const hotel = await Hotel.findOne({
      _id: pricing.hotelId,
      ownerId: req.user._id
    });

    if (!hotel) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    await Pricing.findByIdAndDelete(pricingId);

    res.json({
      message: "Pricing deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};