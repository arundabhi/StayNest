import React, { useState, useEffect } from "react";
import api from "../api/axios.config";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

const WishlistToggle = ({ hotelId }) => {
  const [isWished, setIsWished] = useState(false);
  const token = localStorage.getItem("accessToken");

  // ✅ CHECK STATUS
  useEffect(() => {
    if (!token) return;

    api
      .get(
        `/wishlists/is-wishlisted/${hotelId}`
      )
      .then((res) => setIsWished(res.data.wishlisted))
      .catch(() => {});
  }, [hotelId, token]);

  // ✅ TOGGLE
  const handleToggle = async (e) => {
    e.stopPropagation();

    if (!token) {
      toast.error("Please login to save hotels");
      return;
    }

    try {
      const res = await api.post(
        "/wishlists/toggle",
        { hotelId }
      );

      setIsWished(res.data.wished);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    }
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
