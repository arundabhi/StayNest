import React, { useState, useEffect } from "react";
import { Star, MapPin, Heart, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const HotelCard = ({ hotel }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  
  const [isWished, setIsWished] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  const hasOffer = !!hotel.offer;
  const savingAmount = hasOffer ? hotel.offer.originalPrice - hotel.offer.offerPrice : 0;

  /* 1. Check if hotel is already wishlisted on component mount */
  useEffect(() => {
    if (!token || !hotel) return;
    const checkWishlistStatus = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/wishlists/is-wishlisted/${hotel._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsWished(res.data.wishlisted);
      } catch (err) {
        console.error("Wishlist check failed", err);
      }
    };
    checkWishlistStatus();
  }, [hotel._id, token]);

  /* 2. Handle the Toggle action */
  const handleWishlistToggle = async (e) => {
    e.stopPropagation(); // Prevents navigating to hotel details
    if (!token) return toast.error("Please login to save hotels");

    try {
      setWishLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/wishlists/toggle`,
        { hotelId: hotel._id }, // Sending hotelId in req.body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsWished(res.data.wished);
      toast.success(res.data.message, {
        icon: res.data.wished ? '❤️' : '💔',
      });
    } catch (error) {
      toast.error(error.message || "Failed to update wishlist");
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <div 
      className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative cursor-pointer"
      onClick={() => navigate(`/hotels/${hotel._id}`)}
    >
      {/* OFFER BADGE */}
      {hasOffer && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
          <div className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-rose-200 uppercase tracking-widest">
            {hotel.offer.discountPercent}% OFF
          </div>
          <div className="bg-white/90 backdrop-blur-md text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
             <Sparkles size={10} /> Save ₹{savingAmount}
          </div>
        </div>
      )}

      {/* ❤️ UPDATED WISHLIST BUTTON */}
      <button 
        onClick={handleWishlistToggle}
        disabled={wishLoading}
        className={`absolute top-4 right-4 z-20 p-2.5 backdrop-blur-md rounded-full transition-all border border-white/30 shadow-sm 
          ${isWished 
            ? "bg-rose-500 text-white border-rose-500" 
            : "bg-white/20 text-white hover:bg-white hover:text-rose-500"
          } ${wishLoading ? "opacity-70 animate-pulse" : ""}`}
      >
        <Heart size={18} fill={isWished ? "currentColor" : "none"} />
      </button>

      {/* IMAGE SECTION */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={hotel.images?.[0] || "/hotel-placeholder.jpg"}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* CONTENT SECTION */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-amber-700">{hotel.avgRating || "0.0"}</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 font-medium gap-1 mb-4">
          <MapPin size={14} className="text-blue-500" />
          {hotel.city}
        </div>

        {/* MATCH SCORE */}
        {hotel.matchScore !== undefined && (
          <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100/50 mb-4">
            <div className="flex justify-between items-center mb-1.5">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                 <Sparkles size={12} /> Personalized Match
               </span>
               <span className="text-xs font-bold text-blue-700">{hotel.matchScore}%</span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${hotel.matchScore}%` }}
              />
            </div>
            {hotel.reason && (
              <p className="text-[11px] text-blue-800 font-medium mt-2 leading-tight">
                “{hotel.reason}”
              </p>
            )}
          </div>
        )}

        {/* PRICE & ACTION */}
        <div className="flex justify-between items-center pt-2 mt-auto">
          <div className="space-y-0.5">
            {hasOffer ? (
              <>
                <p className="text-xs text-gray-400 line-through font-bold">
                  ₹{hotel.offer.originalPrice.toLocaleString()}
                </p>
                <div className="flex items-baseline gap-1">
                   <p className="text-2xl font-black text-gray-900">
                     ₹{hotel.offer.offerPrice.toLocaleString()}
                   </p>
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">/ night</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-gray-900">
                  ₹{hotel.basePrice.toLocaleString()}
                </p>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">/ night</span>
              </div>
            )}
          </div>

          <button
            className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-gray-200 group/btn"
          >
            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;