import { Pricing } from "../models/pricing.models.js";

export const calculateDynamicPrice = async ({
  basePrice,
  checkIn,
  checkOut,
  hotelId,
  occupancyRate
}) => {
  let multiplier = 1;

  const pricingRule = await Pricing.findOne({
  hotelId,
  $or: [
    // Booking overlaps with pricing period
    { startDate: { $lte: checkIn }, endDate: { $gte: checkIn } },
    { startDate: { $lte: checkOut }, endDate: { $gte: checkOut } },
    { startDate: { $gte: checkIn }, endDate: { $lte: checkOut } }
  ]
}).sort({ multiplier: -1 }); // Get highest multiplier if multiple

  if (pricingRule) {
    multiplier *= pricingRule.multiplier;
  }


  if (occupancyRate >= 0.9) multiplier *= 1.5;
  else if (occupancyRate >= 0.7) multiplier *= 1.2;

  const day = checkIn.getDay(); 
  if (day === 0 || day === 6) {
    multiplier *= 1.2;
  }

  return Math.round(basePrice * multiplier);
};

