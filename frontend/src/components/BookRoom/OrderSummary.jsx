import React from "react";
import {
  Sparkles,
  Info,
  Ticket,
  ShieldCheck,
  AlertCircle,
  Users,
} from "lucide-react";
import Payment from "../Payment";

const OrderSummary = ({
  pricing,
  data,
  coupon,
  setCoupon,
  applyCoupon,
  isAvailable,
  handleBooking,
  loading,
  availabilityLoading,
  handleJoinWaitlist,
  bookingId,
  paymentMode,
  hotelId,
  navigate,
}) => {
  return (
    <div className="lg:col-span-5">
      <div className="sticky top-24 space-y-6">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex justify-between items-center">
              Price Summary
              <span className="text-xs font-normal text-gray-400">
                All inclusive
              </span>
            </h3>

            <div className="space-y-4">
              {/* Base Price & Special Offer Logic */}
              <div className="flex justify-between text-sm font-bold text-gray-600">
                <span>
                  ₹{pricing?.pricePerDay ?? data.room?.pricePerDay} ×{" "}
                  {pricing?.nights ?? 1} nights
                </span>
                <div className="text-right">
                  {pricing?.specialOfferAmount > 0 && (
                    <span className="text-xs text-gray-400 line-through mr-2">
                      ₹{pricing.pricePerDay * pricing.nights}
                    </span>
                  )}
                  <span>₹{pricing?.subtotal}</span>
                </div>
              </div>

              {/* Highlighted Special Offer Row */}
              {pricing?.specialOfferAmount > 0 && (
                <div className="flex justify-between items-center bg-orange-50 border border-orange-100 p-3 rounded-2xl animate-pulse-subtle">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500 p-1 rounded-full">
                      <Sparkles size={12} className="text-white" />
                    </div>
                    <span className="text-sm font-black text-orange-600 uppercase tracking-tight">
                      {pricing.specialOfferPercent}% Special Offer
                    </span>
                  </div>
                  <span className="text-sm font-black text-orange-600">
                    -₹{pricing.specialOfferAmount}
                  </span>
                </div>
              )}

              {/* Service Fee */}
              <div className="flex justify-between text-sm font-bold text-gray-500 px-1">
                <span className="flex items-center gap-1">
                  Service fee <Info size={12} />
                </span>
                <span>₹{pricing?.serviceFee}</span>
              </div>

              {/* GST */}
              <div className="flex justify-between text-sm font-bold text-gray-500 px-1">
                <span>GST (12%)</span>
                <span>₹{pricing?.gstAmount}</span>
              </div>

              {/* Coupon Row (If applied) */}
              {coupon.applied && (
                <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} />
                    <span>Code: {coupon.applied.coupon.code}</span>
                  </div>
                  <span>-₹{coupon.applied.discountAmount}</span>
                </div>
              )}

              {/* Final Total */}
              <div className="pt-6 border-t border-dashed border-gray-200 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                    Total to pay
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-gray-900 tracking-tighter">
                      ₹{pricing?.totalPrice || 0}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-2 py-1 rounded-full mb-2">
                    <ShieldCheck size={12} /> Secure
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold">
                    Best Price Guaranteed
                  </p>
                </div>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mt-8">
              <div className="flex gap-2">
                <input
                  disabled={
                    coupon.applied ||
                    pricing?.specialOfferAmount > 0 ||
                    !isAvailable
                  }
                  value={coupon.code}
                  onChange={(e) =>
                    setCoupon({
                      ...coupon,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none uppercase font-bold text-sm transition-all disabled:opacity-50"
                  placeholder="COUPON CODE"
                />
                <button
                  disabled={
                    coupon.loading ||
                    coupon.applied ||
                    pricing?.specialOfferAmount > 0 ||
                    !isAvailable
                  }
                  onClick={applyCoupon}
                  className="bg-gray-900 text-white px-6 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all active:scale-95 disabled:bg-gray-200"
                >
                  Apply
                </button>
              </div>
            </div>

            {!bookingId && (
              <div className="space-y-3">
                {isAvailable ? (
                  <button
                    onClick={handleBooking}
                    disabled={loading || availabilityLoading}
                    className="w-full mt-8 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-100 active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Processing..." : "Book This Room"}
                  </button>
                ) : (
                  <div className="mt-8 space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                      <AlertCircle
                        className="text-amber-600 shrink-0"
                        size={20}
                      />
                      <p className="text-xs font-bold text-amber-800 leading-tight">
                        These dates are currently fully booked. Join the
                        waitlist to be first in line if someone cancels!
                      </p>
                    </div>
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={loading || availabilityLoading}
                      className="w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-amber-100 active:scale-[0.98] bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Adding..."
                      ) : (
                        <>
                          <Users size={20} />
                          Join the Waitlist
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {bookingId && (
              <div className="mt-6">
                <Payment
                  bookingId={bookingId}
                  totalPrice={pricing.finalTotal}
                  hotelName={data.hotel.name}
                  paymentMode={paymentMode}
                  onSuccess={() => navigate("/payment-success")}
                />
              </div>
            )}

            <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-tighter">
              Free cancellation before{" "}
              {new Date(
                new Date().getTime() + 24 * 60 * 60 * 1000,
              ).toDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
