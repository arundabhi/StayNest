import { Pricing } from "../models/pricing.models.js";

export const calculateDynamicPrice = async ({
  basePrice,
  checkIn,
  checkOut,
  hotelId,
  occupancyRate
}) => {
  try {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    let seasonMultiplier = 1;

    const pricingRule = await Pricing.findOne({
      hotelId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    }).sort({ multiplier: -1 });

    if (pricingRule) seasonMultiplier = pricingRule.multiplier;

    const occupancyMultiplier =
      occupancyRate >= 0.9 ? 1.5 :
      occupancyRate >= 0.7 ? 1.2 : 1;

    const weekendMultiplier =
      checkIfRangeHasWeekend(startDate, endDate) ? 1.2 : 1;

    let finalMultiplier =
      seasonMultiplier * occupancyMultiplier * weekendMultiplier;

    finalMultiplier = Math.min(finalMultiplier, 2.5);

    return {
      pricePerDay: Math.round(basePrice * finalMultiplier),
      breakdown: {
        seasonMultiplier,
        occupancyMultiplier,
        weekendMultiplier,
        finalMultiplier
      }
    };
  } catch (err) {
    console.error("Dynamic pricing error:", err);
    return {
      pricePerDay: basePrice,
      breakdown: null
    };
  }
};

const checkIfRangeHasWeekend = (startDate, endDate) => {
  const date = new Date(startDate);

  while (date <= endDate) {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return true;
    date.setDate(date.getDate() + 1);
  }

  return false;
};

