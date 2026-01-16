import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import hotelBg from "../assests/hotelBg6.webp"; // Ensure this path is correct
import { MapPin, Search, Users, CalendarDays, ChevronDown, Sparkles } from "lucide-react";
import { DateRange } from "react-date-range";
import { format, addDays } from "date-fns";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const Hero = () => {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [guests, setGuests] = useState(2);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 3),
      key: "selection",
    },
  ]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setOpenCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkIn = range[0].startDate;
  const checkOut = range[0].endDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    const destination = e.target.destination.value.trim();
    navigate(
      `/search?destination=${encodeURIComponent(destination)}&checkIn=${format(
        checkIn,
        "yyyy-MM-dd"
      )}&checkOut=${format(checkOut, "yyyy-MM-dd")}&guests=${guests}`
    );
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center py-20">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110"
        style={{ backgroundImage: `url(${hotelBg})` }}
      />
      
      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative z-20 max-w-6xl w-full px-6 flex flex-col items-center">
        
        {/* TEXT CONTENT AREA */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md border border-white/30">
            <Sparkles size={14} className="text-yellow-400" /> Exclusive Rewards
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-6">
            Smart Savings,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Better Stays.
            </span>
          </h1>
          
          <p className="text-blue-50 font-medium text-lg md:text-xl max-w-2xl mx-auto opacity-90 leading-relaxed">
            Stack up your discounts and travel the world without breaking the bank. 
            Luxury hotels, unique homes, and hidden gems await.
          </p>
        </div>

        {/* SEARCH BAR CONTAINER */}
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-10 delay-200 duration-1000">
          <form
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-xl p-2 md:p-3 rounded-3xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-stretch md:items-center gap-2"
          >
            {/* Location */}
            <div className="flex-1 flex items-center px-6 py-4 md:py-0 border-b md:border-b-0 md:border-r border-gray-100">
              <MapPin className="text-blue-600 mr-4" size={24} />
              <div className="text-left w-full">
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Location</label>
                <input
                  name="destination"
                  required
                  placeholder="Where are you going?"
                  className="w-full text-sm md:text-base font-bold text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="flex-1 relative px-6 py-4 md:py-0 border-b md:border-b-0 md:border-r border-gray-100" ref={calendarRef}>
              <div 
                className="flex items-center cursor-pointer group"
                onClick={() => setOpenCalendar(!openCalendar)}
              >
                <CalendarDays className="text-blue-600 mr-4" size={24} />
                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Check In - Out</label>
                  <p className="text-sm md:text-base font-bold text-gray-800 whitespace-nowrap">
                    {format(checkIn, "MMM d")} — {format(checkOut, "MMM d")}
                  </p>
                </div>
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${openCalendar ? 'rotate-180' : ''}`} />
              </div>

              {openCalendar && (
                <div className="absolute top-[120%] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 z-50 bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                  <DateRange
                    ranges={range}
                    onChange={(item) => setRange([item.selection])}
                    minDate={new Date()}
                    months={window.innerWidth > 768 ? 2 : 1}
                    direction="horizontal"
                    rangeColors={["#2563eb"]}
                    showDateDisplay={false}
                  />
                </div>
              )}
            </div>

            {/* Travelers */}
            <div className="flex-[0.6] flex items-center px-6 py-4 md:py-0">
              <Users className="text-blue-600 mr-4" size={24} />
              <div className="text-left w-full">
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Travelers</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full text-sm md:text-base font-bold text-gray-800 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-5 md:p-6 rounded-2xl md:rounded-full font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 active:scale-95 group"
            >
              <Search size={24} className="group-hover:scale-110 transition-transform" />
              <span className="md:hidden">Search Stays</span>
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="hidden md:flex justify-center gap-4 mt-10">
            {['Luxury', 'Beachfront', 'Pet Friendly', 'Self-Catering'].map((tag) => (
              <span 
                key={tag} 
                className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white cursor-pointer hover:bg-white/20 transition-all hover:-translate-y-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
