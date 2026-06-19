import { useQuery } from "@tanstack/react-query";
import { hotelService } from "../services/hotelService";

export const useHotelDetails = (hotelId) => {
  return useQuery({
    queryKey: ["hotel", hotelId],
    queryFn: () => hotelService.getHotelById(hotelId),
    enabled: !!hotelId,
  });
};

export const useHotelRooms = (hotelId) => {
  return useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: () => hotelService.getHotelRooms(hotelId),
    enabled: !!hotelId,
  });
};

export const useHotelReviews = (hotelId) => {
  return useQuery({
    queryKey: ["reviews", hotelId],
    queryFn: () => hotelService.getHotelReviews(hotelId),
    enabled: !!hotelId,
  });
};

export const useHotelMasterData = (hotelId) => {
  return useQuery({
    queryKey: ["hotel-master", hotelId],
    queryFn: async () => {
      const [hotel, rooms, reviews, offer, pricing, similar] = await Promise.all([
        hotelService.getHotelById(hotelId),
        hotelService.getHotelRooms(hotelId),
        hotelService.getHotelReviews(hotelId),
        hotelService.getHotelOffers(hotelId).catch(() => ({ success: false })),
        hotelService.getHotelPricing(hotelId).catch(() => ({ success: false })),
        hotelService.getSimilarHotels(hotelId).catch(() => ({ success: false })),
      ]);
      
      return {
        hotel: hotel.hotel,
        rooms: rooms.rooms,
        reviews: reviews.reviews,
        offer: offer.offer,
        pricing: pricing.pricing,
        similar: similar.hotels,
      };
    },
    enabled: !!hotelId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
