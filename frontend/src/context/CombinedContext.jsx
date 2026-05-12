import React from "react";
import { AuthProvider } from "./AuthContext";
import { WishlistProvider } from "./WishlistContext";
import { HotelProvider } from "./HotelContext";

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <HotelProvider>
          {children}
        </HotelProvider>
      </WishlistProvider>
    </AuthProvider>
  );
};

export { useAuth } from "./AuthContext";
export { useWishlist } from "./WishlistContext";
export { useHotel } from "./HotelContext";
