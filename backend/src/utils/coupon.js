export const calculateCouponDiscount = (coupon, bookingAmount) => {
  if (!coupon || !bookingAmount || bookingAmount <= 0) {
    return 0;
  }


  if (
    coupon.minimumBookingAmount &&
    bookingAmount < coupon.minimumBookingAmount
  ) {
    return 0;
  }

  let discountAmount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (bookingAmount * coupon.discountValue) / 100;
  }

  if (coupon.discountType === "FLAT") {
    discountAmount = coupon.discountValue;
  }

 
  discountAmount = Math.min(discountAmount, bookingAmount);

  
  return Math.round(discountAmount);
};