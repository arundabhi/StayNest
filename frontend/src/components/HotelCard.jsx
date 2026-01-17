import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Heart } from "lucide-react";
import api from "../api/axios.config";
import toast from "react-hot-toast";

const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${className}`}>
    {children}
  </span>
);

const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition ${className}`}
  >
    {children}
  </button>
);

const HotelCard = ({ hotel }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const token = localStorage.getItem("accessToken");

  // 1. Check if wishlisted on mount
  useEffect(() => {
    if (!token || !hotel._id) return;
    const checkStatus = async () => {
      try {
        const res = await api.get(`${import.meta.env.VITE_API_URL}/wishlists/is-wishlisted/${hotel._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsWishlisted(res.data.wishlisted);
      } catch (err) {
  if (err.response?.status === 401 || err.response?.status === 403) {
    // user not logged in → silently ignore
    return;
  }
  console.error("Wishlist check failed", err);
}

    };
    checkStatus();
  }, [hotel._id, token]);

  // 2. Toggle wishlist logic
  const handleWishlistToggle = async (e) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Prevent card click events

    if (!token) {
      return toast.error("Please login to save stays");
    }

    try {
      setWishLoading(true);
      const res = await api.post(
        `${import.meta.env.VITE_API_URL}/wishlists/toggle`,
        { hotelId: hotel._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsWishlisted(res.data.wished);
      toast.success(res.data.message, {
        icon: res.data.wished ? '❤️' : '💔',
      });
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 group relative">
      
      {/* 🖼️ Image Section */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={hotel.images?.[0] || "/placeholder-hotel.jpg"}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* ❤️ Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishLoading}
          className="absolute top-3 left-3 z-10 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:scale-110 transition-all active:scale-90"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
            } ${wishLoading ? "animate-pulse" : ""}`}
          />
        </button>

        {/* 🏷️ Badges */}
        <div className="absolute bottom-3 left-3 flex gap-2">
            {hotel.popularityScore > 0 && (
            <Badge className="bg-blue-600 text-white">Popular</Badge>
            )}
            {hotel.bookingCount > 0 && (
            <Badge className="bg-orange-500 text-white">🔥 {hotel.bookingCount} bookings</Badge>
            )}
        </div>

        {hotel.avgRating > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1 text-sm font-semibold shadow-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {hotel.avgRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* 📝 Content Section */}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors truncate">
          {hotel.name}
        </h3>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          {hotel.city}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">₹{hotel.basePrice}</span>
            <span className="text-sm text-gray-500"> / night</span>
          </div>

          <Link to={`/hotels/${hotel._id}`}>
            <Button>View details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;