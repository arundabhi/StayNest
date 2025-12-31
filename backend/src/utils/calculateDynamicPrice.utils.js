import { Pricing } from "../models/pricing.models.js";

export const calculateDynamicPrice = async ({
  basePrice,
  checkIn,
  checkOut,
  hotelId,
  occupancyRate
}) => {
  try {
    // ✅ Ensure dates are Date objects
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    if (isNaN(startDate) || isNaN(endDate)) {
      throw new Error("Invalid dates provided");
    }

    let multiplier = 1;

    // 1️⃣ Special pricing rules
    const pricingRule = await Pricing.findOne({
      hotelId,
      $or: [
        { startDate: { $lte: startDate }, endDate: { $gte: startDate } },
        { startDate: { $lte: endDate }, endDate: { $gte: endDate } },
        { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
      ]
    }).sort({ multiplier: -1 });

    if (pricingRule) {
      multiplier = Math.max(multiplier, pricingRule.multiplier); // Use max, not multiply
    }

    // 2️⃣ Occupancy-based pricing (additive, not multiplicative)
    let occupancyBonus = 0;
    if (occupancyRate >= 0.9) occupancyBonus = 0.5; // +50%
    else if (occupancyRate >= 0.7) occupancyBonus = 0.2; // +20%
    
    // 3️⃣ Weekend pricing - check ALL days in range
    const hasWeekend = checkIfRangeHasWeekend(startDate, endDate);
    const weekendBonus = hasWeekend ? 0.2 : 0; // +20%

    // ✅ Add bonuses instead of multiplying (more predictable)
    multiplier += occupancyBonus + weekendBonus;
    
    // ✅ Cap maximum multiplier to prevent extreme prices
    multiplier = Math.min(multiplier, 2.5); // Max 250% of base price

    return Math.round(basePrice * multiplier);
  } catch (error) {
    console.error("Dynamic pricing error:", error);
    return basePrice; // Fallback to base price on error
  }
};

// Helper function to check if date range includes weekend
function checkIfRangeHasWeekend(start, end) {
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day === 0 || day === 6) return true;
    current.setDate(current.getDate() + 1);
  }
  return false;
}