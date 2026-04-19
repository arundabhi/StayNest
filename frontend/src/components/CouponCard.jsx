import React, { useState } from "react";
import { Copy, Tag, Clock, CheckCircle2, Info } from "lucide-react";

const CouponCard = ({ coupon, onApply }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(coupon.expiryDate) < new Date();

  return (
    <div
      className={`relative bg-white rounded-3xl overflow-hidden border transition-all duration-300 group
        ${
          isExpired
            ? "bg-gray-50 border-gray-100 opacity-75 grayscale"
            : "border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10"
        }`}
    >
      {/* TICKET CUTOUTS (CSS hack for that 'punched' look) */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#F8FAFC] rounded-full border border-gray-200 z-10 -translate-y-1/2 hidden md:block" />
      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#F8FAFC] rounded-full border border-gray-200 z-10 -translate-y-1/2 hidden md:block" />

      <div className="p-6">
        {/* HEADER & DISCOUNT */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div
              className={`p-3 rounded-2xl ${isExpired ? "bg-gray-200" : "bg-blue-50 text-blue-600"}`}
            >
              <Tag size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">
                {coupon.title || "Special Discount"}
              </h3>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                Code: <span className="text-blue-600">{coupon.code}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-emerald-600 tracking-tighter">
              {coupon.discountType === "PERCENTAGE"
                ? `${coupon.discountValue}%`
                : `₹${coupon.discountValue}`}
            </div>
            <div className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-widest leading-none">
              OFF
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        {coupon.description && (
          <p className="text-sm text-gray-600 mb-6 line-clamp-2 min-h-10">
            {coupon.description}
          </p>
        )}

        {/* DASHED DIVIDER */}
        <div className="border-t-2 border-dashed border-gray-100 my-6 relative" />

        {/* FOOTER INFO */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
              <Info size={14} className="text-blue-500" />
              Min. Booking: ₹{coupon.minimumBookingAmount}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
              <Clock
                size={14}
                className={isExpired ? "text-rose-500" : "text-amber-500"}
              />
              {isExpired
                ? "Expired"
                : `Ends ${new Date(coupon.expiryDate).toLocaleDateString()}`}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={copyCode}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 
                ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} /> Copied
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy
                </>
              )}
            </button>

            {onApply && !isExpired && (
              <button
                onClick={() => onApply(coupon.code)}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                Apply
              </button>
            )}
          </div>
        </div>

        {/* EXPIRED OVERLAY LABEL */}
        {isExpired && (
          <div className="absolute top-4 right-4 rotate-12">
            <span className="border-2 border-rose-500 text-rose-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest opacity-50">
              Expired
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponCard;
