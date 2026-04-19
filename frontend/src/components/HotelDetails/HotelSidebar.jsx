import React from "react";
import { Zap, Calendar, Users, Globe } from "lucide-react";

const HotelSidebar = ({
  hotelData,
  stayDates,
  guests,
  params,
  navigate,
  festivalPricing,
  dynamicPricing,
  handleDateChange,
  handleCheckAvailability,
  hotelId,
}) => {
  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        {/* PRICE */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-2">
            <Zap size={13} className="fill-current" /> Instant Confirmation
          </div>
          {festivalPricing ? (
            <div>
              <p className="text-sm text-gray-400 line-through">
                ₹{hotelData.basePrice.toLocaleString()}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-orange-600">
                  ₹{dynamicPricing.finalPrice.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400">/ night</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-gray-900">
                ₹{hotelData.basePrice.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400">/ night</span>
            </div>
          )}
        </div>

        {/* DATE PICKERS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 ring-indigo-400/30">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Check-in
            </label>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-500 shrink-0" />
              <input
                type="date"
                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={stayDates.checkIn}
                onChange={(e) => handleDateChange("checkIn", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 ring-indigo-400/30">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Check-out
            </label>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-500 shrink-0" />
              <input
                type="date"
                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={stayDates.checkOut}
                onChange={(e) => handleDateChange("checkOut", e.target.value)}
                min={
                  stayDates.checkIn || new Date().toISOString().split("T")[0]
                }
              />
            </div>
          </div>
        </div>

        {/* GUESTS */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Guests
            </label>
            <select
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              value={guests}
              onChange={(e) => {
                const p = new URLSearchParams(params);
                p.set("guests", e.target.value);
                navigate({ search: p.toString() }, { replace: true });
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Adult" : "Adults"}
                </option>
              ))}
            </select>
          </div>
          <Users size={18} className="text-gray-300" />
        </div>

        {/* CTA BUTTONS */}
        <button
          onClick={handleCheckAvailability}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition active:scale-95"
        >
          Check Availability
        </button>
        <button
          onClick={() => navigate(`/hotels/chat/${hotelId}`)}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <Globe size={16} /> Negotiate Rates
        </button>

        <p className="text-xs text-center text-gray-400">
          Free cancellation on most rooms · No hidden fees
        </p>
      </div>
    </aside>
  );
};

export default HotelSidebar;
