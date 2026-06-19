import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "../services/wishlistService";

export const useWishlist = (options = {}) => {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistService.getWishlist,
    ...options,
  });
};

export const useIsWishlisted = (hotelId, roomId = null, options = {}) => {
  return useQuery({
    queryKey: ["wishlisted", hotelId, roomId],
    queryFn: () => wishlistService.isWishlisted(hotelId, roomId),
    enabled: !!hotelId,
    ...options,
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => wishlistService.toggleWishlist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlisted"] });
    },
  });
};

export const useRemoveWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wishlistId) => wishlistService.removeWishlist(wishlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlisted"] });
    },
  });
};

