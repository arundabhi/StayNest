export const calculateFinalPrice = ({ pricePerDay, nights }) => {
  const subtotal = pricePerDay * nights;

  const gstRate = 0.12;          // 12% GST
  const serviceFee = 100;        // flat platform fee

  const gstAmount = Math.round(subtotal * gstRate);
  const totalPrice = subtotal + gstAmount + serviceFee;

  return {
    nights,
    pricePerDay,
    subtotal,
    gstAmount,
    serviceFee,
    totalPrice,
  };
};
