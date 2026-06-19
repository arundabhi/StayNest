import React from "react";
import { AuthProvider } from "./AuthContext";
import { WishlistProvider } from "./WishlistContext";

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </AuthProvider>
  );
};

export { useAuth } from "./AuthContext";
export { useWishlistContext } from "./WishlistContext";
