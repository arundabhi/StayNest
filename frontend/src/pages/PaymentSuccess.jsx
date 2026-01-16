import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const session_id = params.get("session_id"); // Stripe
  const bookingId = params.get("bookingId");   // Razorpay

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No auth token");

        // ✅ STRIPE VERIFICATION
        if (session_id) {
          await axios.get(
            `${import.meta.env.VITE_API_URL}/payment/stripe/verify`,
            {
              params: { session_id },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        if (bookingId) {
          await axios.patch(
            `${import.meta.env.VITE_API_URL}/payment/razorpay/confirm/${bookingId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        setTimeout(() => {
          navigate("/bookings");
        }, 2500);

      } catch (error) {
        console.error(error);
        navigate("/payment-failed");
      }
    };

    if (session_id || bookingId) {
      verifyPayment();
    }
  }, [session_id, bookingId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow text-center">
        <h1 className="text-2xl font-bold text-green-600">
          ✅ Payment Successful
        </h1>
        <p className="text-gray-600 mt-2">
          Verifying payment & redirecting to your bookings…
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
