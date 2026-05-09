import React from "react";
import { useWishlist } from "../context/WishlistContext";
import { Heart } from "lucide-react";

const WishlistToggle = ({ hotelId }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWished = isInWishlist(hotelId);

  const handleToggle = async (e) => {
    e.stopPropagation();
    await toggleWishlist(hotelId);
  };

  return (
    <button
      onClick={handleToggle}
      className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all border shadow-sm ${
        isWished
          ? "bg-rose-50 border-rose-100 text-rose-500"
          : "bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white hover:text-rose-500"
      }`}
    >
      <Heart size={20} fill={isWished ? "currentColor" : "none"} />
    </button>
  );
};

export default WishlistToggle;

