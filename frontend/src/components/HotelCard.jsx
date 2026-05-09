import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Star, Heart, Sparkles, Gift, ArrowRight } from "lucide-react";
import api from "../api/axios.config";
import toast from "react-hot-toast";

/**
 * A Unified, Premium Hotel Card component.
 * Handles:
 * - Standard listing info (name, city, price)
 * - Wishlist toggling with state persistence
 * - Personalized match scores (from AI recommendations)
 * - Special Offers (Festival multiplier or standard percentage)
 * - Premium hover effects and micro-animations
 */
const HotelCard = ({ hotel, searchParams = "" }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [isWished, setIsWished] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [festivalOffer, setFestivalOffer] = useState(null);

  const hasOffer = !!hotel.offer;
  const savingAmount = hasOffer
    ? hotel.offer.originalPrice - hotel.offer.offerPrice
    : 0;

  // 1. Check wishlist status on mount
  useEffect(() => {
    if (!token || !hotel?._id) return;
    const checkStatus = async () => {
      try {
        const res = await api.get(`/wishlists/is-wishlisted/${hotel._id}`);
        setIsWished(res.data.wishlisted);
      } catch (err) {
        // Silently fail for auth/401 errors
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Wishlist check failed", err);
        }
      }
    };
    checkStatus();
  }, [hotel?._id, token]);

  // 2. Fetch Festival Pricing if applicable
  useEffect(() => {
    if (!hotel?._id) return;
    const fetchFestivalPricing = async () => {
      try {
        const res = await api.get(`/pricing/${hotel._id}`);
        if (res.data.success && res.data.pricing) {
          setFestivalOffer(res.data.pricing);
        }
      } catch (err) {
        // Silent catch: hotel simply has no festival pricing
      }
    };
    fetchFestivalPricing();
  }, [hotel?._id]);

  // 3. Toggle wishlist logic
  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      return toast.error("Please login to save stays");
    }

    try {
      setWishLoading(true);
      const res = await api.post("/wishlists/toggle", { hotelId: hotel._id });
      setIsWished(res.data.wished);
      toast.success(res.data.message, {
        icon: res.data.wished ? "❤️" : "💔",
      });
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setWishLoading(false);
    }
  };

  // Logic: Priority given to Festival Offer Multiplier, then Standard Offer, then Base Price
  const renderPrice = () => {
    if (festivalOffer) {
      return (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 line-through font-bold">
            ₹{hotel.basePrice?.toLocaleString()}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-600">
              ₹{(hotel.basePrice * festivalOffer.multiplier).toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              / night
            </span>
          </div>
        </div>
      );
    }

    if (hasOffer) {
      return (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 line-through font-bold">
            ₹{hotel.offer.originalPrice?.toLocaleString()}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">
              ₹{hotel.offer.offerPrice?.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              / night
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-gray-900">
          ₹{hotel.basePrice?.toLocaleString()}
        </span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
          / night
        </span>
      </div>
    );
  };

  return (
    <div
      className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative cursor-pointer"
      onClick={() => navigate(`/hotels/${hotel._id}${searchParams}`)}
    >
      {/* --- IMAGE SECTION --- */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={hotel.images?.[0] || "/placeholder-hotel.jpg"}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* ❤️ Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishLoading}
          className={`absolute top-4 right-4 z-20 p-2.5 backdrop-blur-md rounded-full transition-all border border-white/30 shadow-sm 
            ${
              isWished
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-white/20 text-white hover:bg-white hover:text-rose-500"
            } ${wishLoading ? "opacity-70 animate-pulse" : ""}`}
        >
          <Heart size={18} fill={isWished ? "currentColor" : "none"} />
        </button>

        {/* 🏷️ Badges Container */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Rating Badge */}
          <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/50 flex items-center gap-1 text-amber-500 self-start">
            <Star size={14} fill="currentColor" />
            <span className="text-xs font-black text-gray-900">
              {hotel.avgRating?.toFixed(1) || "0.0"}
            </span>
          </div>

          {/* Festival Offer Badge */}
          {festivalOffer && (
            <div className="bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest animate-pulse">
              <Gift size={12} /> {festivalOffer.name} Offer
            </div>
          )}

          {/* Standard Offer Badge */}
          {hasOffer && !festivalOffer && (
            <>
              <div className="bg-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-200 uppercase tracking-widest self-start">
                {hotel.offer.discountPercent}% OFF
              </div>
              <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full border border-emerald-400/50 flex items-center gap-1 self-start">
                <span className="flex items-center gap-1">
                    <Sparkles size={10} /> Save ₹{savingAmount?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {hotel.name}
          </h3>
        </div>

        <div className="flex items-center text-sm text-gray-500 font-medium gap-1 mb-4">
          <MapPin size={14} className="text-blue-500" />
          {hotel.city}
        </div>

        {/* 🎯 PERSONALIZED MATCH (Conditional) */}
        {hotel.matchScore !== undefined && (
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 mb-5 group-hover:bg-blue-50 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} /> Personalized Match
              </span>
              <span className="text-xs font-black text-blue-700">
                {hotel.matchScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${hotel.matchScore}%` }}
              />
            </div>
            {hotel.reason && (
              <p className="text-[11px] text-blue-800/80 font-bold leading-tight mt-3 italic line-clamp-2">
                “{hotel.reason}”
              </p>
            )}
          </div>
        )}

        {/* 💳 PRICE & ACTION --- */}
        <div className="flex justify-between items-end pt-2">
          {renderPrice()}

          <button
            className={`p-3.5 rounded-2xl transition-all shadow-xl active:scale-90 group/btn ${
              festivalOffer
                ? "bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                : "bg-gray-900 hover:bg-blue-600 shadow-gray-200"
            }`}
          >
            <ArrowRight
              size={20}
              className="text-white group-hover/btn:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
