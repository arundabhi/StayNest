import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios.config";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get("/wishlists");
      if (res.data?.success) {
        setWishlist(res.data.wishlist.map((item) => item.hotelId._id || item.hotelId));
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (hotelId) => {
    if (!isLoggedIn) {
      toast.error("Please login to save hotels");
      return;
    }

    try {
      const res = await api.post("/wishlists/toggle", { hotelId });
      if (res.data?.success) {
        if (res.data.wished) {
          setWishlist((prev) => [...prev, hotelId]);
          toast.success("Hotel saved to wishlist", { icon: "❤️" });
        } else {
          setWishlist((prev) => prev.filter((id) => id !== hotelId));
          toast.success("Hotel removed from wishlist", { icon: "💔" });
        }
        return res.data.wished;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
      throw error;
    }
  };

  const isInWishlist = (hotelId) => wishlist.includes(hotelId);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        toggleWishlist,
        isInWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
