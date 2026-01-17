import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import { MapPin, Star, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const Hotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await api.get(`${import.meta.env.VITE_API_URL}/hotels`);
        if (res.data.success) {
          setHotels(res.data.hotels);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  /* --- INTERNAL WISHLIST TOGGLE COMPONENT --- */
  const WishlistToggle = ({ hotelId }) => {
    const [isWished, setIsWished] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const token = localStorage.getItem("accessToken");

    // Check status on mount
    useEffect(() => {
      if (!token) return;
      const checkStatus = async () => {
        try {
          // Matches your route: /is-wishlisted/:hotelId
          const res = await api.get(`${import.meta.env.VITE_API_URL}/wishlists/is-wishlisted/${hotelId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsWished(res.data.wishlisted);
        } catch (err) {
          console.error("Wishlist check failed", err);
        }
      };
      checkStatus();
    }, [hotelId, token]);

    const handleToggle = async (e) => {
      e.stopPropagation(); // Prevents navigating to hotel details
      
      if (!token) {
        return toast.error("Please login to save stays");
      }

      try {
        setActionLoading(true);
        // UPDATED: Sending hotelId in req.body as per your backend change
        const res = await api.post(
          `${import.meta.env.VITE_API_URL}/wishlists/toggle`, 
          { hotelId }, // This goes to req.body
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setIsWished(res.data.wished);
        toast.success(res.data.message);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update wishlist");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <button 
        onClick={handleToggle}
        disabled={actionLoading}
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all border shadow-sm ${
          isWished 
            ? "bg-rose-50 border-rose-100 text-rose-500" 
            : "bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white hover:text-rose-500"
        } ${actionLoading ? "opacity-70 cursor-wait" : ""}`}
      >
        <Heart size={20} fill={isWished ? "currentColor" : "none"} className={actionLoading ? "animate-pulse" : ""} />
      </button>
    );
  };

  /* --- Skeleton Loader --- */
  const Skeleton = () => (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-60 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-20 bg-gray-50 rounded" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-3xl border border-rose-100 max-w-md">
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-sm opacity-80 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFDFD] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">
              <ShieldCheck size={18} />
              Verified Stays
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">adventure.</span>
            </h1>
            <p className="text-gray-500 mt-4 text-lg max-w-xl">
              From luxury suites to cozy boutique stays, explore our handpicked collection.
            </p>
          </div>
          <div className="flex gap-2">
             <span className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">{hotels.length} Properties</span>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {hotels.map((hotel) => (
              <div
                key={hotel._id}
                className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden cursor-pointer relative"
                onClick={() => navigate(`/hotels/${hotel._id}`)}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* RUNNABLE WISHLIST BUTTON */}
                  <WishlistToggle hotelId={hotel._id} />

                  <div className="absolute top-4 left-4 flex gap-2">
                    {hotel.avgRating >= 4.5 && (
                      <span className="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        Guest Favorite
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                      <Star size={14} className="text-blue-600 fill-blue-600" />
                      <span className="text-sm font-bold text-blue-700">{hotel.avgRating || "4.2"}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                    <MapPin size={14} className="text-blue-500" />
                    {hotel.city}
                  </p>

                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-6">
                    {hotel.description}
                  </p>

                  <hr className="border-gray-50 mb-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-gray-900">₹{hotel.basePrice}</span>
                      <span className="text-gray-400 text-sm font-medium"> /night</span>
                    </div>
                    
                    <div className="bg-gray-900 text-white p-3 rounded-2xl group-hover:bg-blue-600 transition-colors shadow-lg shadow-gray-200">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;