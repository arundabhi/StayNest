import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
        
        {/* ICON */}
        <div className="flex justify-center mb-4">
          <XCircle size={64} className="text-red-500" />
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Failed
        </h1>

        {/* MESSAGE */}
        <p className="text-gray-600 mb-6">
          Your payment could not be completed.  
          This may be due to insufficient balance, network issues, or payment cancellation.
        </p>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Retry Payment
          </button>

          <button
            onClick={() => navigate("/bookings")}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Go to My Bookings
          </button>
        </div>

        {/* SUPPORT */}
        <p className="text-sm text-gray-400 mt-6">
          If the amount was deducted, it will be refunded automatically within 5–7 working days.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
