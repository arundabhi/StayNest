import { Pricing } from "../models/pricing.models.js";


export const calculateDynamicPrice = async ({
  basePrice,
  checkIn,
  checkOut,
  hotelId,
  occupancyRate,
}) => {
  try {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

   

    let seasonMultiplier = 1;

    const pricingRule = await Pricing.findOne({
      hotelId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).sort({ multiplier: -1 });
  
    if (pricingRule) {
      seasonMultiplier = pricingRule.multiplier;
    }


    const occupancyMultiplier =
      occupancyRate >= 0.95 ? 1.4 :
      occupancyRate >= 0.85 ? 1.25 :
      occupancyRate >= 0.7  ? 1.1  :
      1;


    const { weekendDays, totalDays } = countWeekendDays(startDate, endDate);

    const weekendMultiplier =
      weekendDays > 0
        ? 1 + (0.2 * (weekendDays / totalDays))
        : 1;

    

    let finalMultiplier =
      seasonMultiplier *
      occupancyMultiplier *
      weekendMultiplier;

    finalMultiplier = Math.min(finalMultiplier, 2.5);

    const pricePerDay = Math.round(basePrice * finalMultiplier);

    return {
      pricePerDay,
      breakdown: {
        basePrice,
        seasonMultiplier,
        occupancyMultiplier,
        weekendMultiplier,
        weekendDays,
        totalDays,
        finalMultiplier,
        capped: finalMultiplier === 2.5,
      },
    };
  } catch (error) {
    console.error("Dynamic pricing error:", error);

  
    return {
      pricePerDay: basePrice,
      breakdown: {
        basePrice,
        fallback: true,
        reason: "dynamic_pricing_error",
      },
    };
  }
};



const countWeekendDays = (startDate, endDate) => {
  let weekendDays = 0;
  let totalDays = 0;

  const date = new Date(startDate);
  const end = new Date(endDate);

  while (date < end) {
    const day = date.getUTCDay(); // 5 = Friday night, 6 = Saturday night
    totalDays++;

    if (day === 5 || day === 6) {
      weekendDays++;
    }

    date.setUTCDate(date.getUTCDate() + 1);
  }

  return { weekendDays, totalDays };
};
