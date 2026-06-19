import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useHotelMasterData } from "../hooks/useHotelQueries";

const HotelContext = createContext();

export const HotelProvider = ({ children }) => {
  const [hotelId, setHotelId] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Use the new React Query hook
  const { data, isLoading: loading, refetch: refreshData } = useHotelMasterData(hotelId);

  const [stayDates, setStayDates] = useState({
    checkIn: params.get("checkIn") || "",
    checkOut: params.get("checkOut") || "",
  });
  const [selectedRoomType, setSelectedRoomType] = useState("All");

  const guests = params.get("guests") || "1";

  // Sync stay dates with URL if they change externally (optional but good)
  useEffect(() => {
    const checkIn = params.get("checkIn");
    const checkOut = params.get("checkOut");
    if (checkIn || checkOut) {
      setStayDates({
        checkIn: checkIn || "",
        checkOut: checkOut || "",
      });
    }
  }, [params]);

  const handleDateChange = (field, value) => {
    setStayDates((prev) => ({ ...prev, [field]: value }));
    const newParams = new URLSearchParams(params);
    newParams.set(field, value);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  const dynamicPricing = useMemo(() => {
    const hotelData = data?.hotel;
    const festivalPricing = data?.pricing;
    
    if (!hotelData) return { finalPrice: 0, discount: 0 };
    if (festivalPricing?.multiplier) {
      return {
        finalPrice: Math.round(hotelData.basePrice * festivalPricing.multiplier),
        discount: Math.round((1 - festivalPricing.multiplier) * 100),
      };
    }
    return { finalPrice: hotelData.basePrice, discount: 0 };
  }, [data]);

  const filteredSuites = useMemo(() => {
    const rooms = data?.rooms || [];
    if (selectedRoomType === "All") return rooms;
    return rooms.filter((r) => r.roomType === selectedRoomType);
  }, [data, selectedRoomType]);

  const value = {
    hotelId,
    setHotelId,
    hotelData: data?.hotel || null,
    rooms: data?.rooms || [],
    reviews: data?.reviews || [],
    standardOffer: data?.offer || null,
    festivalPricing: data?.pricing || null,
    similarHotels: data?.similar || [],
    loading,
    stayDates,
    guests,
    selectedRoomType,
    setSelectedRoomType,
    dynamicPricing,
    filteredSuites,
    handleDateChange,
    refreshData,
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

