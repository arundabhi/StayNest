import React, { useState, useEffect } from "react";
import api from "../api/axios.config"; // Your axios instance with interceptors
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

const RoomWishlistToggle = ({ roomId, hotelId }) => {
  const [isWished, setIsWished] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("accessToken");

  // 1. Initial Status Check
  useEffect(() => {
    if (!token || !roomId) return;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/wishlists/is-wishlisted/${hotelId}`, {
          params: { roomId } // Passes roomId as a query parameter
        });
        setIsWished(res.data.wishlisted);
      } catch (err) {
        console.error("Wishlist sync error:", err);
      }
    };
    checkStatus();
  }, [roomId, hotelId, token]);

  // 2. Toggle Action
  const handleToggle = async (e) => {
    e.stopPropagation(); // Prevents clicking the heart from navigating to another page
    
    if (!token) {
      return toast.error("Please login to save this suite", {
        icon: '🔒',
        style: { borderRadius: '15px', background: '#333', color: '#fff' }
      });
    }

    try {
      setLoading(true);
      const res = await api.post(`/wishlists/toggle`, {
        hotelId,
        roomId
      });

      setIsWished(res.data.wished);
      
      toast.success(res.data.message, {
        icon: res.data.wished ? '❤️' : '💔',
        duration: 2000
      });

    } catch (error) {
      toast.error(error.response?.data?.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`absolute top-4 right-4 z-20 p-3 rounded-full transition-all duration-300 border backdrop-blur-md shadow-lg
        ${isWished 
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