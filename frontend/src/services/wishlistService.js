import api from "../api/axios.config";

export const wishlistService = {
  getWishlist: async () => {
    const res = await api.get("/wishlists");
    return res.data;
  },
  
  toggleWishlist: async (payload) => {
    // Support passing either a string (hotelId) or an object ({ hotelId, roomId })
    const data = typeof payload === "string" ? { hotelId: payload } : payload;
    const res = await api.post("/wishlists/toggle", data);
    return res.data;
  },
  
  isWishlisted: async (hotelId, roomId = null) => {
    const config = roomId ? { params: { roomId } } : {};
    const res = await api.get(`/wishlists/is-wishlisted/${hotelId}`, config);
    return res.data;
  },

  removeWishlist: async (wishlistId) => {
    const res = await api.delete(`/wishlists/${wishlistId}`);
    return res.data;
  }
};

