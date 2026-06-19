import api from "../api/axios.config";

export const hotelService = {
  getHotelById: async (id) => {
    const res = await api.get(`/hotels/${id}`);
    return res.data;
  },
  
  getHotelRooms: async (id) => {
    const res = await api.get(`/rooms/hotel/${id}`);
    return res.data;
  },
  
  getHotelReviews: async (id) => {
    const res = await api.get(`/reviews/hotel/${id}`);
    return res.data;
  },
  
  getHotelOffers: async (id) => {
    const res = await api.get(`/recommendations/offer/${id}`);
    return res.data;
  },
  
  getHotelPricing: async (id) => {
    const res = await api.get(`/pricing/${id}`);
    return res.data;
  },
  
  getSimilarHotels: async (id) => {
    const res = await api.get(`/recommendations/similar/${id}`);
    return res.data;
  },
  
  getAvailability: async (hotelId, params) => {
    const res = await api.get(`/availability/hotel/${hotelId}/calendar`, { params });
    return res.data;
  }
};
