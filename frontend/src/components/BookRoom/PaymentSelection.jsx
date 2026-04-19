import React from "react";
import { CreditCard, Languages, ShieldCheck } from "lucide-react";

const PaymentSelection = ({ paymentMode, setPaymentMode, isAvailable }) => {
  return (
    <section className={!isAvailable ? "opacity-50 pointer-events-none" : ""}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Choose how to pay
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: "STRIPE",
            label: "Stripe",
            sub: "Credit / Debit Card",
            icon: <CreditCard />,
          },
          {
            id: "RAZORPAY",
            label: "Razorpay",
            sub: "UPI / NetBanking",
            icon: <Languages />,
          },
          {
            id: "COD",
            label: "Pay at Hotel",
            sub: "Guarantee stay",
            icon: <ShieldCheck />,
          },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setPaymentMode(m.id)}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              paymentMode === m.id
                ? "border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <div
              className={
                paymentMode === m.id ? "text-blue-600" : "text-gray-400"
              }
            >
              {m.icon}
            </div>
            <p className="font-bold text-gray-900 mt-3">{m.label}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
              {m.sub}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default PaymentSelection;
