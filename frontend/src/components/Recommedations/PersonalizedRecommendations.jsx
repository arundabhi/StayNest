import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star, MapPin, Sparkles, ArrowRight, Info, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PersonalizedRecommendations = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!token) {
          setError("Login required to see your personalized picks.");
          return;
        }

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/recommendations/personalized`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setHotels(res.data.recommendations);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [token]);

  /* --- INTERNAL WISHLIST TOGGLE LOGIC --- */
  const WishlistButton = ({ hotelId }) => {
    const [isWished, setIsWished] = useState(false);
    const [wishLoading, setWishLoading] = useState(false);

    // Check if wishlisted on mount
    useEffect(() => {
      if (!token || !hotelId) return;
      const checkStatus = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/wishlists/is-wishlisted/${hotelId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsWished(res.data.wishlisted);
        } catch (err) { 
          console.error(err);
        toast.error(err.message) }
      };
      checkStatus();
    }, [hotelId]);

    const handleToggle = async (e) => {
      e.stopPropagation(); // Prevents navigating to hotel details
      if (!token) return toast.error("Please login to save stays");

      try {
        setWishLoading(true);
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/wishlists/toggle`, 
          { hotelId }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsWished(res.data.wished);
        toast.success(res.data.message);
      } catch (error) {
        toast.error(error.message || "Failed to update wishlist");
      } finally {
        setWishLoading(false);
      }
    };

    return (
      <button 
        onClick={handleToggle}
        disabled={wishLoading}
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all border backdrop-blur-md shadow-sm ${
          isWished 
            ? "bg-rose-50 border-rose-100 text-rose-500 shadow-rose-100" 
            : "bg-white/20 border-white/30 text-white hover:bg-white hover:text-rose-500"
        } ${wishLoading ? "opacity-50" : ""}`}
      >
        <Heart size={20} fill={isWished ? "currentColor" : "none"} className={wishLoading ? "animate-pulse" : ""} />
      </button>
    );
  };

  /* --- Skeleton Component --- */
  const Skeleton = () => (
    <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-12 bg-gray-50 rounded-2xl" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => <Skeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] border border-rose-100 inline-block">
          <Info className="mx-auto mb-3" size={32} />
          <p className="font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (hotels.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Recommended for You
          </h2>
          <p className="text-gray-500 font-medium">Intelligence-driven picks for your next stay</p>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hotels.map((hotel) => (
          <div
            key={hotel._id}
            onClick={() => navigate(`/hotels/${hotel._id}`)}
            className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden cursor-pointer relative"
          >
            {/* WISHLIST BUTTON COMPONENT */}
            <WishlistButton hotelId={hotel._id} />

            {/* IMAGE WITH RATING BADGE */}
            <div className="relative h-52 overflow-hidden">
              <img
                src={hotel.images?.[0] || "/hotel-placeholder.jpg"}
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/50">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-black text-gray-900">{hotel.avgRating || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                {hotel.name}
              </h3>

              <div className="flex items-center text-sm text-gray-500 font-medium gap-1 mb-6">
                <MapPin size={14} className="text-blue-500" />
                {hotel.city}
              </div>

              {/* MATCH SCORE BOX */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 mb-6 group-hover:bg-blue-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} /> Personalized Match
                  </span>
                  <span className="text-xs font-black text-blue-700">{hotel.matchScore}%</span>
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

              {/* PRICE & BUTTON */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Starting total</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">
                    ₹{hotel.basePrice.toLocaleString()}
                  </p>
                </div>

                <button
                  className="bg-gray-900 text-white p-3 rounded-2xl group-hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-95"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PersonalizedRecommendations;