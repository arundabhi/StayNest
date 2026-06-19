import React, { useState } from "react";
import api from "../api/axios.config";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Payment = ({
  bookingId,
  paymentMode, // 👈 passed from RoomBook
  hotel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!paymentMode) {
      toast.error("Payment mode missing");
      return;
    }

    try {
      setLoading(true);

      /* ---------- STRIPE ---------- */
      if (paymentMode === "STRIPE") {
        const stripe = await api.post(
          `/payment/stripe/${bookingId}`
        );

        window.location.href = stripe.data.sessionUrl;
        return;
      }

      /* ---------- RAZORPAY ---------- */
      if (paymentMode === "RAZORPAY") {
        const order = await api.post(
          `/payment/razorpay/${bookingId}`
        );

        new window.Razorpay({
          key: order.data.key,
          amount: order.data.amount,
          currency: order.data.currency,
          order_id: order.data.orderId,
          name: hotel?.name || "Hotel Booking",
          handler: async (resp) => {
            await api.post(
              `/payment/razorpay/verify`,
              {
                bookingId,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }
            );

            onSuccess ? onSuccess() : navigate("/payment-failed");
          },
        }).open();

        return;
      }

      /* ---------- COD ---------- */
      if (paymentMode === "COD") {
        await api.post(
          `/payment/cod/${bookingId}`
        );

        navigate(`/bookings/my/${bookingId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md space-y-4">
      <h3 className="font-semibold text-lg">Payment</h3>

      <p className="text-sm text-gray-600">
        Payment Method: <strong>{paymentMode}</strong>
      </p>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold"
      >
        {loading ? "Processing…" : "Pay Now"}
      </button>
    </div>
  );
};

export default Payment;
