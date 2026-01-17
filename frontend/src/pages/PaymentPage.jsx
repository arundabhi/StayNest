import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import toast from "react-hot-toast";

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [booking, setBooking] = useState(null);
  const [paymentMode, setPaymentMode] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH BOOKING ---------------- */
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_API_URL}/bookings/my/${bookingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const bookingData = res.data.booking;

        if (bookingData.paymentStatus === "success") {
          navigate("/bookings");
          return;
        }

        setBooking(bookingData);
        setPaymentMode(bookingData.paymentMode); // 👈 from backend
      } catch (err) {
        toast.error("Failed to load booking");
        navigate("/bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate, token]);

  /* ---------------- HANDLE PAYMENT ---------------- */
  const handlePayment = async () => {
    try {
      if (!paymentMode) {
        toast.error("Select payment method");
        return;
      }

      /* STRIPE */
      if (paymentMode === "STRIPE") {
        const res = await api.post(
          `${import.meta.env.VITE_API_URL}/payment/stripe/${bookingId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        window.location.href = res.data.sessionUrl;
        return;
      }

      /* RAZORPAY */
      if (paymentMode === "RAZORPAY") {
        const order = await api.post(
          `${import.meta.env.VITE_API_URL}/payment/razorpay/${bookingId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        new window.Razorpay({
          key: order.data.key,
          amount: order.data.amount,
          currency: order.data.currency,
          order_id: order.data.orderId,
          name: booking.hotelId.name,
          handler: async (resp) => {
            await api.post(
              `${import.meta.env.VITE_API_URL}/payment/razorpay/verify`,
              {
                bookingId,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate(`/payment-success?bookingId=${bookingId}`);
          },
        }).open();
        return;
      }

      /* COD */
      if (paymentMode === "COD") {
        await api.post(
          `${import.meta.env.VITE_API_URL}/payment/cod/${bookingId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigate("/bookings");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading payment...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Complete Payment</h2>

        <div className="text-sm text-gray-600 mb-4">
          <p><b>Hotel:</b> {booking.hotelId.name}</p>
          <p><b>Room:</b> {booking.roomId.title}</p>
          <p><b>Total Amount:</b> ₹{booking.totalPrice}</p>
        </div>

        <div className="space-y-3">
          {["COD", "STRIPE", "RAZORPAY"].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`w-full p-4 border rounded-xl ${
                paymentMode === mode
                  ? "border-blue-600 bg-blue-50"
                  : ""
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={handlePayment}
          className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold"
        >
          Pay ₹{booking.totalPrice}
        </button>
      </div>
    </div>
  );
};

export default Payment;
