import api from "../api/axios.config";

export const bookingService = {
  getMyBookings: async () => {
    const res = await api.get("/bookings/my");
    return res.data;
  },

  getUpcomingBookings: async () => {
    const res = await api.get("/bookings/upcoming");
    return res.data;
  },
  
  getBookingById: async (id) => {
    const res = await api.get(`/bookings/my/${id}`);
    return res.data;
  },
  
  createBooking: async (hotelId, roomId, data) => {
    const res = await api.post(`/bookings/${hotelId}/${roomId}`, data);
    return res.data;
  },
  
  getPricePreview: async (hotelId, roomId, params) => {
    const res = await api.get(`/bookings/price-preview/${hotelId}/${roomId}`, { params });
    return res.data;
  },
  
  cancelBooking: async (id) => {
    const res = await api.patch(`/bookings/cancel/${id}`);
    return res.data;
  },
  
  deleteBooking: async (id) => {
    const res = await api.delete(`/bookings/${id}`);
    return res.data;
  }
};
