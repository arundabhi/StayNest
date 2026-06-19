import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft } from "lucide-react";

import TripDetails from "../components/BookRoom/TripDetails";
import RoomFeatures from "../components/BookRoom/RoomFeatures";
import PaymentSelection from "../components/BookRoom/PaymentSelection";
import OrderSummary from "../components/BookRoom/OrderSummary";

const RoomBook = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [totalGuest, setTotalGuest] = useState(
    Number(searchParams.get("guests")) || 1,
  );

  const [availabilityStatus, setAvailabilityStatus] = useState("idle");
  const [data, setData] = useState({ hotel: null, room: null });
  const [pricing, setPricing] = useState(null);
  const [coupon, setCoupon] = useState({
    code: "",
    applied: null,
    loading: false,
  });
  const [bookingId, setBookingId] = useState(null);
  const [paymentMode, setPaymentMode] = useState("STRIPE");
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  const [availabilityCalendar, setAvailabilityCalendar] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [useSpecialOffer, setUseSpecialOffer] = useState(false);

  const hasShownBlockedToast = useRef(false);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const normalizeDate = (value, fallback) => {
    if (!value || value === "null" || value === "undefined") {
      return fallback;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? fallback : value;
  };

  const [dates, setDates] = useState({
    checkIn: normalizeDate(searchParams.get("checkIn"), formatDate(today)),
    checkOut: normalizeDate(searchParams.get("checkOut"), formatDate(tomorrow)),
  });

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (dates.checkIn) params.set("checkIn", dates.checkIn);
    if (dates.checkOut) params.set("checkOut", dates.checkOut);
    params.set("guests", totalGuest);
    navigate(`?${params.toString()}`, { replace: true });
  }, [dates, totalGuest, navigate]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, rRes] = await Promise.all([
          api.get(`/hotels/${hotelId}`),
          api.get(`/rooms/${roomId}`),
        ]);
        setData({ hotel: hRes.data.hotel, room: rRes.data.room });
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to load room details",
        );
      }
    };
    fetchData();
  }, [hotelId, roomId]);

  /* ---------------- AVAILABILITY & PRICE CHECK ---------------- */
  useEffect(() => {
    if (!dates.checkIn || !dates.checkOut || !data.room) return;

    const checkAvailabilityAndPrice = async () => {
      try {
        setAvailabilityLoading(true);

        const availRes = await api.get(
          `/availability/room/${roomId}/calendar`,
          {
            params: {
              startDate: dates.checkIn,
              endDate: dates.checkOut,
            },
          },
        );

        if (!availRes.data.success) {
          setAvailabilityStatus("unavailable");
          setIsAvailable(false);
          setPricing({ unavailable: true });
          return;
        }

        const calendar = availRes.data.calendar || [];
        setAvailabilityCalendar(calendar);
        if (calendar.length === 0) {
          setAvailabilityStatus("unavailable");
          setIsAvailable(false);
          setPricing({ unavailable: true });
          return;
        }

        const blockedDay = calendar.find((d) => !d.isAvailable);
        const validDates = new Date(dates.checkOut) > new Date(dates.checkIn);
        if (blockedDay && validDates && !hasShownBlockedToast.current) {
          toast.error(`Not available on ${blockedDay.date}`);
          hasShownBlockedToast.current = true;
        }

        const roomAvailable = calendar.every((day) => day.isAvailable);
        setIsAvailable(roomAvailable);

        if (!roomAvailable) {
          setAvailabilityStatus("unavailable");
          setIsAvailable(false);
          setPricing({ unavailable: true });
          return;
        }

        const priceRes = await api.get(
          `/bookings/price-preview/${hotelId}/${roomId}`,
          {
            params: {
              checkIn: dates.checkIn,
              checkOut: dates.checkOut,
              totalGuest,
              couponCode: coupon.code,
            },
          },
        );

        setPricing(priceRes.data.pricing);
        setUseSpecialOffer(priceRes.data.pricing.specialOfferAmount > 0);
        setAvailabilityStatus("available");
      } catch (error) {
        console.error(error);
        setAvailabilityStatus("unavailable");
        setIsAvailable(false);
        setPricing({ unavailable: true });
      } finally {
        setAvailabilityLoading(false);
      }
    };

    checkAvailabilityAndPrice();
  }, [dates, totalGuest, data.room, hotelId, roomId, coupon.code]);

  /* ---------------- WAITLIST ACTION ---------------- */
  const handleJoinWaitlist = async () => {
    if (!isLoggedIn) return navigate("/auth");

    try {
      setLoading(true);
      await api.post(
        `/waitlists/${roomId}`,
        {
          ...dates,
          totalGuest,
        }
      );
      toast.success("Added to waitlist! We'll notify you if a room opens up.");
      navigate("/user/waitlists");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hasShownBlockedToast.current = false;
  }, [dates.checkIn, dates.checkOut]);


  /* ---------------- ACTIONS ---------------- */
  const applyCoupon = async () => {
    if (!coupon.code || coupon.applied) return;
    try {
      setCoupon((prev) => ({ ...prev, loading: true }));
      const res = await api.post(
        "/coupons/validate",
        { code: coupon.code, bookingAmount: pricing.subtotal, hotelId }
      );
      setCoupon((prev) => ({ ...prev, applied: res.data, loading: false }));

      setPricing((prev) => ({
        ...prev,
        finalTotal: prev.subtotal - res.data.discountAmount,
      }));
      setAvailabilityStatus("available");
      toast.success("Coupon applied!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon");
      setCoupon((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleBooking = async () => {
    if (!isLoggedIn) return navigate("/auth");
    if (!dates.checkIn || !dates.checkOut)
      return toast.error("Please select dates");
    if (!isAvailable)
      return toast.error("Room is no longer available for these dates");

    try {
      setLoading(true);
      const res = await api.post(
        `/bookings/${hotelId}/${roomId}`,
        {
          ...dates,
          totalGuest,
          paymentMode,
          couponCode: coupon.applied?.coupon.code || null,
          useSpecialOffer,
        }
      );
      setBookingId(res.data.booking._id);
      toast.success("Booking initiated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!data.hotel || !data.room)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium italic">
          Preparing your checkout...
        </p>
      </div>
    );

  if (availabilityStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 my-20">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all font-semibold text-sm group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50">
            <ArrowLeft size={18} />
          </div>
          Back to selection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <TripDetails
              dates={dates}
              setDates={setDates}
              totalGuest={totalGuest}
              setTotalGuest={setTotalGuest}
              data={data}
              availabilityLoading={availabilityLoading}
              isAvailable={isAvailable}
            />
            <RoomFeatures data={data} />
            <PaymentSelection
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
              isAvailable={isAvailable}
            />
          </div>

          <OrderSummary
            pricing={pricing}
            data={data}
            coupon={coupon}
            setCoupon={setCoupon}
            applyCoupon={applyCoupon}
            isAvailable={isAvailable}
            handleBooking={handleBooking}
            loading={loading}
            availabilityLoading={availabilityLoading}
            handleJoinWaitlist={handleJoinWaitlist}
            bookingId={bookingId}
            paymentMode={paymentMode}
            hotelId={hotelId}
            navigate={navigate}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomBook;
