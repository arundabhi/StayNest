export const calculateFinalPrice = ({ pricePerDay, nights }) => {
  const subtotal = pricePerDay * nights;

  const gstRate = 0.12;         
  const serviceFee = 100;       

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
