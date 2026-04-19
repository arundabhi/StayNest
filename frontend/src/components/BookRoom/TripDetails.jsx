import React from "react";
import { Calendar, Users } from "lucide-react";

const TripDetails = ({
  dates,
  setDates,
  totalGuest,
  setTotalGuest,
  data,
  availabilityLoading,
  isAvailable,
}) => {
  return (
    <section className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Confirm trip details
        </h2>
        {!availabilityLoading && dates.checkIn && (
          <span
            className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
              isAvailable
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}
          >
            {isAvailable ? "Available Now" : "Join Waitlist"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dates Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Stay Period
            </span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <p className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-blue-600 uppercase">
                Check-in
              </p>
              <input
                type="date"
                className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition"
                value={dates.checkIn}
                onChange={(e) =>
                  setDates({ ...dates, checkIn: e.target.value })
                }
              />
            </div>
            <div className="relative flex-1">
              <p className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-blue-600 uppercase">
                Check-out
              </p>
              <input
                type="date"
                className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition"
                value={dates.checkOut}
                onChange={(e) =>
                  setDates({ ...dates, checkOut: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Guest Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Users size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Travelers
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="font-bold text-gray-700">{totalGuest} Guests</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTotalGuest(Math.max(1, totalGuest - 1))}
                className="w-8 h-8 bg-white border rounded-full shadow-sm hover:bg-gray-100 font-bold"
              >
                -
              </button>
              <button
                onClick={() =>
                  setTotalGuest(
                    Math.min(data.room?.maxGuests || 6, totalGuest + 1),
                  )
                }
                className="w-8 h-8 bg-white border rounded-full shadow-sm hover:bg-gray-100 font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripDetails;
