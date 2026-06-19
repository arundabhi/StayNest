import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "../services/bookingService";

export const useMyBookings = () => {
  return useQuery({
    queryKey: ["bookings", "my"],
    queryFn: bookingService.getMyBookings,
  });
};

export const useUpcomingBookings = () => {
  return useQuery({
    queryKey: ["bookings", "upcoming"],
    queryFn: bookingService.getUpcomingBookings,
  });
};

export const useBookingDetails = (bookingId) => {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBookingById(bookingId),
    enabled: !!bookingId,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, roomId, data }) => 
      bookingService.createBooking(hotelId, roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const usePricePreview = (hotelId, roomId, params) => {
  return useQuery({
    queryKey: ["price-preview", hotelId, roomId, params],
    queryFn: () => bookingService.getPricePreview(hotelId, roomId, params),
    enabled: !!hotelId && !!roomId && !!params.checkIn && !!params.checkOut,
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};
