import React, { createContext, useContext } from "react";
import { useWishlist, useToggleWishlist, useRemoveWishlist } from "../hooks/useWishlistQueries";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  // Use TanStack Query hooks, enabled only if logged in to prevent 401 console errors
  const { data, isLoading: loading, refetch: refreshWishlist } = useWishlist({ enabled: isLoggedIn });
  const toggleMutation = useToggleWishlist();
  const removeMutation = useRemoveWishlist();

  // Keep full populated wishlist array or empty array if not loaded
  const wishlistItems = data?.wishlist || [];

  const toggleWishlist = async (hotelId, roomId = null) => {
    if (!isLoggedIn) {
      toast.error("Please login to save stays");
      return false;
    }

    try {
      const res = await toggleMutation.mutateAsync({ hotelId, roomId });
      toast.success(res.message, {
        icon: res.wished ? "❤️" : "💔",
      });
      return res.wished;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
      return false;
    }
  };

  const removeWishlist = async (wishlistId) => {
    if (!isLoggedIn) return false;
    try {
      await removeMutation.mutateAsync(wishlistId);
      toast.success("Removed from wishlist", { icon: "💔" });
      return true;
    } catch (error) {
      toast.error("Failed to remove item");
      return false;
    }
  };

  const isInWishlist = (hotelId, roomId = null) => {
    return wishlistItems.some((item) => {
      const itemHotelId = item.hotelId?._id || item.hotelId;
      const itemRoomId = item.roomId?._id || item.roomId;
      
      if (roomId) {
        return itemHotelId === hotelId && itemRoomId === roomId;
      }
      // If we only query by hotelId, we check if the hotel matches
      return itemHotelId === hotelId;
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist: wishlistItems,
        loading,
        toggleWishlist,
        removeWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return context;
};

