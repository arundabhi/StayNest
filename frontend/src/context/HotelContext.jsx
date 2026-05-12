import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import toast from "react-hot-toast";

const HotelContext = createContext();

export const HotelProvider = ({ children }) => {
  const { hotelId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [hotelData, setHotelData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [standardOffer, setStandardOffer] = useState(null);
  const [festivalPricing, setFestivalPricing] = useState(null);
  const [similarHotels, setSimilarHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stayDates, setStayDates] = useState({
    checkIn: params.get("checkIn") || "",
    checkOut: params.get("checkOut") || "",
  });
  const [selectedRoomType, setSelectedRoomType] = useState("All");

  const guests = params.get("guests") || "1";

  const handleDateChange = (field, value) => {
    setStayDates((prev) => ({ ...prev, [field]: value }));
    const newParams = new URLSearchParams(params);
    newParams.set(field, value);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  const loadMasterData = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [hotelR, roomR, revR, offR, festR, simR] = await Promise.all([
        api.get(`/hotels/${hotelId}`).catch((err) => err.response || { data: { success: false } }),
        api.get(`/rooms/hotel/${hotelId}`).catch((err) => err.response || { data: { success: false } }),
        api.get(`/reviews/hotel/${hotelId}`).catch((err) => err.response || { data: { success: false } }),
        api.get(`/recommendations/offer/${hotelId}`).catch(() => ({ data: { success: false } })),
        api.get(`/pricing/${hotelId}`).catch(() => ({ data: { success: false } })),
        api.get(`/recommendations/similar/${hotelId}`).catch(() => ({ data: { success: false } })),
      ]);

      if (hotelR.data?.success) setHotelData(hotelR.data.hotel);
      else throw new Error("Hotel not found"); // Critical

      if (roomR.data?.success) setRooms(roomR.data.rooms);
      if (revR.data?.success) setReviews(revR.data.reviews);
      if (offR.data?.success) setStandardOffer(offR.data.offer);
      if (festR.data?.success) setFestivalPricing(festR.data.pricing);
      if (simR.data?.success) setSimilarHotels(simR.data.hotels);
    } catch (error) {
      console.error("Hotel data load error:", error);
      toast.error("Failed to load hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (hotelId) {
      setHotelData(null);
      setRooms([]);
      setReviews([]);
      loadMasterData();
    } else {
      setLoading(false);
    }
  }, [loadMasterData, hotelId]);

  const dynamicPricing = useMemo(() => {
    if (!hotelData) return { finalPrice: 0, discount: 0 };
    if (festivalPricing?.multiplier) {
      return {
        finalPrice: Math.round(hotelData.basePrice * festivalPricing.multiplier),
        discount: Math.round((1 - festivalPricing.multiplier) * 100),
      };
    }
    return { finalPrice: hotelData.basePrice, discount: 0 };
  }, [hotelData, festivalPricing]);

  const filteredSuites = useMemo(() => {
    if (selectedRoomType === "All") return rooms;
    return rooms.filter((r) => r.roomType === selectedRoomType);
  }, [rooms, selectedRoomType]);

  const value = {
    hotelId,
    hotelData,
    rooms,
    reviews,
    standardOffer,
    festivalPricing,
    similarHotels,
    loading,
    stayDates,
    guests,
    selectedRoomType,
    setSelectedRoomType,
    dynamicPricing,
    filteredSuites,
    handleDateChange,
    refreshData: loadMasterData,
  };

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
};



export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error("useHotel must be used within a HotelProvider");
  }
  return context;
};
