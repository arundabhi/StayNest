import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlistContext } from "../context/WishlistContext";
import { useHotel } from "../context/HotelContext";

const RoomWishlistToggle = ({ roomId, hotelId }) => {
  const { toggleWishlist, isInWishlist } = useWishlistContext();
  const { hotelId: contextHotelId } = useHotel();
  const [loading, setLoading] = useState(false);

  const finalHotelId = hotelId || contextHotelId;
  const isWished = isInWishlist(finalHotelId, roomId);

  // Toggle Action
  const handleToggle = async (e) => {
    e.stopPropagation(); // Prevents clicking the heart from navigating to another page

    try {
      setLoading(true);
      await toggleWishlist(finalHotelId, roomId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`absolute top-4 right-4 z-20 p-3 rounded-full transition-all duration-300 border backdrop-blur-md shadow-lg
        ${
          isWished
            ? "bg-rose-500 border-rose-500 text-white scale-110 shadow-rose-200"
            : "bg-black/20 border-white/30 text-white hover:bg-white hover:text-rose-500 hover:scale-105"
        } 
        ${loading ? "opacity-50 cursor-not-allowed" : "active:scale-90"}`}
      title={isWished ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={20}
        fill={isWished ? "currentColor" : "none"}
        className={`${loading ? "animate-pulse" : "transition-transform"}`}
      />
    </button>
  );
};

export default RoomWishlistToggle;

