import React, { useEffect, useState } from "react";
import { X, Calendar, AlertCircle, CheckCircle2, Moon, Sparkles } from "lucide-react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";

const RoomAvailabilityModal = ({ isOpen, onClose, roomId, roomTitle, pricePerDay, handleBookingRedirect, handleDateChange }) => {
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selection dates (YYYY-MM-DD)
  const [selCheckIn, setSelCheckIn] = useState("");
  const [selCheckOut, setSelCheckOut] = useState("");
  const [hoveredDate, setHoveredDate] = useState("");

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomCalendar();
      setSelCheckIn("");
      setSelCheckOut("");
    }
  }, [isOpen, roomId]);

  const fetchRoomCalendar = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split("T")[0];
      // Fetch 45 days of availability calendar
      const next45Days = new Date();
      next45Days.setDate(next45Days.getDate() + 45);
      const endStr = next45Days.toISOString().split("T")[0];

      const res = await api.get(`/availability/room/${roomId}/calendar`, {
        params: {
          startDate: todayStr,
          endDate: endStr,
        },
      });

      if (res.data.success) {
        setCalendar(res.data.calendar || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load availability calendar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDateClick = (dateStr, isAvailable) => {
    if (!isAvailable) {
      toast.error("This date is sold out!");
      return;
    }

    if (!selCheckIn || (selCheckIn && selCheckOut)) {
      // First click or resetting selection
      setSelCheckIn(dateStr);
      setSelCheckOut("");
    } else {
      // Second click: setting check-out
      if (new Date(dateStr) <= new Date(selCheckIn)) {
        // If checkout is before checkin, swap them
        setSelCheckIn(dateStr);
        setSelCheckOut("");
      } else {
        // Check if any date in the range is unavailable/sold out
        const startIndex = calendar.findIndex(d => d.date === selCheckIn);
        const endIndex = calendar.findIndex(d => d.date === dateStr);
        
        let hasBlockedDate = false;
        for (let i = startIndex; i < endIndex; i++) {
          if (calendar[i] && !calendar[i].isAvailable) {
            hasBlockedDate = true;
            break;
          }
        }

        if (hasBlockedDate) {
          toast.error("Selected range contains sold out dates!");
          return;
        }

        setSelCheckOut(dateStr);
      }
    }
  };

  const getDayStatus = (dateStr) => {
    if (!selCheckIn) return "none";
    if (selCheckIn === dateStr && !selCheckOut) return "start-only";
    if (selCheckIn === dateStr) return "start";
    if (selCheckOut === dateStr) return "end";
    
    const checkTime = new Date(dateStr).getTime();
    const inTime = new Date(selCheckIn).getTime();
    
    if (selCheckOut) {
      const outTime = new Date(selCheckOut).getTime();
      if (checkTime > inTime && checkTime < outTime) return "between";
    } else if (hoveredDate) {
      const hoverTime = new Date(hoveredDate).getTime();
      if (checkTime > inTime && checkTime <= hoverTime) return "hover-between";
    }
    
    return "none";
  };

  // Calculations
  const calculateStayDetails = () => {
    if (!selCheckIn || !selCheckOut) return null;
    const diffTime = Math.abs(new Date(selCheckOut) - new Date(selCheckIn));
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalCost = nights * pricePerDay;
    return { nights, totalCost };
  };

  const stayDetails = calculateStayDetails();

  const handleConfirmDates = () => {
    if (!selCheckIn || !selCheckOut) return;
    
    // Set stay dates in global context
    handleDateChange("checkIn", selCheckIn);
    handleDateChange("checkOut", selCheckOut);
    
    toast.success("Stay dates updated!");
    onClose();
    
    // Redirect to booking page with override dates
    handleBookingRedirect(roomId, selCheckIn, selCheckOut);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        {/* LEFT COLUMN: CALENDAR GRID */}
        <div className="flex-1 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-1">
                Real-Time Occupancy
              </span>
              <h3 className="text-xl font-black text-slate-800">
                {roomTitle}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Fetching availability calendar...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* LEGEND */}
              <div className="flex gap-4 text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Sold Out
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Selected Range
                </div>
              </div>

              {/* CALENDAR SCROLLABLE STRIP */}
              <div className="max-h-[360px] overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {calendar.map((day) => {
                    const status = getDayStatus(day.date);
                    const isSelected = status === "start" || status === "end" || status === "start-only";
                    const isBetween = status === "between" || status === "hover-between";
                    const formattedDate = new Date(day.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    });

                    return (
                      <div
                        key={day.date}
                        onClick={() => handleDateClick(day.date, day.isAvailable)}
                        onMouseEnter={() => selCheckIn && !selCheckOut && setHoveredDate(day.date)}
                        className={`relative select-none p-3.5 rounded-2xl border text-center transition-all duration-150 cursor-pointer flex flex-col justify-between h-24
                          ${day.isAvailable 
                            ? "bg-white hover:border-indigo-400 hover:shadow-sm" 
                            : "bg-rose-50/40 border-rose-100 text-rose-400 cursor-not-allowed opacity-60"
                          }
                          ${isSelected ? "bg-indigo-600 border-indigo-600 text-white hover:border-indigo-600 shadow-md shadow-indigo-200" : ""}
                          ${isBetween ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold" : ""}
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] uppercase font-black tracking-widest ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                            {day.dayOfWeek}
                          </span>
                          {day.isAvailable ? (
                            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`} />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>

                        <div className="my-1.5">
                          <span className="text-base font-black leading-none block">
                            {formattedDate}
                          </span>
                        </div>

                        <div>
                          {day.isAvailable ? (
                            <span className={`text-[10px] font-bold block ${isSelected ? "text-indigo-100" : "text-emerald-600"}`}>
                              {day.availableRooms} {day.availableRooms === 1 ? "room" : "rooms"} left
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold block text-rose-500">
                              Sold out
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BOOKING SUMMARY SIDEBAR */}
        <div className="md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
              Stay Planner
            </h4>

            {/* SELECTION PREVIEW */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Check-In</p>
                {selCheckIn ? (
                  <p className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500" />
                    {new Date(selCheckIn).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">Select from calendar</p>
                )}
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Check-Out</p>
                {selCheckOut ? (
                  <p className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500" />
                    {new Date(selCheckOut).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">Select from calendar</p>
                )}
              </div>
            </div>

            {/* COST BREAKDOWN */}
            {stayDetails ? (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Moon size={14} /> Price per Night
                  </span>
                  <span>₹{pricePerDay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                  <span>Nights Stay</span>
                  <span>{stayDetails.nights} {stayDetails.nights === 1 ? "night" : "nights"}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-lg font-black text-slate-800">
                  <span>Total Base Cost</span>
                  <span className="text-indigo-600">₹{stayDetails.totalCost.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 p-4 rounded-2xl text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200">
                Choose check-in & check-out dates to calculate pricing details.
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleConfirmDates}
              disabled={!selCheckIn || !selCheckOut}
              className="w-full py-4 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:shadow-none active:scale-[0.98]"
            >
              Select Dates & Book Now
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-transparent text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoomAvailabilityModal;
