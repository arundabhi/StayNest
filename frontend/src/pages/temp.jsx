import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Calendar, Users, CreditCard, Ticket, CheckCircle, ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react";
import Payment from "../components/Payment";

const RoomBook = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* ---------------- STATE ---------------- */
  const [dates, setDates] = useState({
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
  });
  const [totalGuest, setTotalGuest] = useState(Number(searchParams.get("guests")) || 1);
  const offerPercent = Number(searchParams.get("offer")) || 0;

  const [data, setData] = useState({ hotel: null, room: null });
  const [pricing, setPricing] = useState(null);
  const [coupon, setCoupon] = useState({ code: "", applied: null, loading: false });
  const [bookingId, setBookingId] = useState(null);
  const [paymentMode, setPaymentMode] = useState("STRIPE");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [availabilityCalendar, setAvailabilityCalendar] = useState([]);

  // NEW: Availability States
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const hasShownBlockedToast = React.useRef(false);


  /* ---------------- HELPERS ---------------- */
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (dates.checkIn) params.set("checkIn", dates.checkIn);
    if (dates.checkOut) params.set("checkOut", dates.checkOut);
    params.set("guests", totalGuest);
    if (offerPercent) params.set("offer", offerPercent);
    navigate(`?${params.toString()}`, { replace: true });
  }, [dates, totalGuest, offerPercent, navigate]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, rRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/hotels/${hotelId}`),
          axios.get(`${import.meta.env.VITE_API_URL}/rooms/${roomId}`),
        ]);
        setData({ hotel: hRes.data.hotel, room: rRes.data.room });
      } catch (err) {
        toast.error(err?.response?.data?.message  || "Failed to load room details");
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

      // ✅ ROOM AVAILABILITY CALENDAR (CORRECT ENDPOINT + PARAMS)
      const availRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/availability/room/${roomId}/calendar`,
        {
          params: {
            startDate: dates.checkIn,
            endDate: dates.checkOut,
          },
        }
      );

      if (!availRes.data.success) {
        setIsAvailable(false);
        setPricing(null);
        return;
      }

      const calendar = availRes.data.calendar || [];
      setAvailabilityCalendar(calendar);
      if (calendar.length === 0) {
  setIsAvailable(false);
  setPricing(null);
  return;
}

const blockedDay = calendar.find(d => !d.isAvailable);
if (blockedDay && !hasShownBlockedToast.current) {
  toast.error(`Not available on ${blockedDay.date}`);
  hasShownBlockedToast.current = true;
}

      // 🔍 room is available ONLY if every day has availability
      const roomAvailable = calendar.every(day => day.isAvailable);

      setIsAvailable(roomAvailable);

      if (!roomAvailable) {
        setPricing(null);
        return;
      }

      // ✅ PRICE PREVIEW (only if available)
      const priceRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/price-preview/${hotelId}/${roomId}`,
        {
          params: {
            checkIn: dates.checkIn,
            checkOut: dates.checkOut,
            totalGuest,
          },
        }
      );

      const base = priceRes.data.pricing.totalPrice;
      const discount = offerPercent
        ? Math.round((base * offerPercent) / 100)
        : 0;

      setPricing({
        baseTotal: base,
        offerDiscount: discount,
        finalTotal: base - discount,
        nights: priceRes.data.pricing.nights,
      });
    } catch (error) {
      console.error(error);
      setIsAvailable(false);
      setPricing(null);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  checkAvailabilityAndPrice();
}, [dates, totalGuest, data.room, hotelId, roomId, offerPercent]);

useEffect(() => {
  hasShownBlockedToast.current = false;
}, [dates.checkIn, dates.checkOut]);

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return setIsLoggedIn(false);
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsLoggedIn(true);
      } catch { setIsLoggedIn(false); }
    };
    checkAuth();
  }, []);

  /* ---------------- ACTIONS ---------------- */
  const applyCoupon = async () => {
    if (!coupon.code || coupon.applied) return;
    try {
      setCoupon(prev => ({ ...prev, loading: true }));
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/coupons/validate`,
        { code: coupon.code, bookingAmount: pricing.baseTotal },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setCoupon(prev => ({ ...prev, applied: res.data, loading: false }));
      setPricing(prev => ({ ...prev, finalTotal: prev.baseTotal - res.data.discountAmount }));
      toast.success("Coupon applied!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon");
      setCoupon(prev => ({ ...prev, loading: false }));
    }
  };

  const handleBooking = async () => {
    if (!isLoggedIn) return navigate("/auth");
    if (!dates.checkIn || !dates.checkOut) return toast.error("Please select dates");
    if (!isAvailable) return toast.error("Room is no longer available for these dates");

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings/${hotelId}/${roomId}`,
        {
          ...dates,
          totalGuest,
          paymentMode,
          couponCode: coupon.applied?.coupon.code || null,
          offerPercent
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setBookingId(res.data.booking._id);
      toast.success("Booking initiated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!data.hotel || !data.room) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black transition">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Hotel</span>
          </button>
          <h1 className="font-bold text-lg hidden md:block text-gray-800">Review and Pay</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-8">
          
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Your Trip</h2>
              {/* AVAILABILITY BADGE */}
              {!availabilityLoading && dates.checkIn && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {isAvailable ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                  {isAvailable ? "Available" : "Sold Out"}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              {/* DATES */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <p className="font-bold text-gray-700">Dates</p>
                  <p className="text-gray-500 text-sm">{dates.checkIn || "Select"} to {dates.checkOut || "Select"}</p>
                </div>
                <div className="flex gap-2">
                   <input 
                    type="date" 
                    min={new Date().toISOString().split("T")[0]}
                    className="border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={dates.checkIn}
                    onChange={(e) => setDates({...dates, checkIn: e.target.value})}
                   />
                   <input 
                    type="date" 
                    min={dates.checkIn || new Date().toISOString().split("T")[0]}
                    className="border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={dates.checkOut}
                    onChange={(e) => setDates({...dates, checkOut: e.target.value})}
                   />
                </div>
              </div>

              {/* UNAVAILABILITY WARNING */}
              {/* AVAILABILITY CALENDAR */}
{availabilityCalendar.length > 0 && (
  <div className="mt-4">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
      Room availability
    </p>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {availabilityCalendar.map((day) => {
        const isSelected =
  new Date(day.date) >= new Date(dates.checkIn) &&
  new Date(day.date) < new Date(dates.checkOut);


        return (
          <div
  key={day.date}
  onClick={() => {
    if (!day.isAvailable) return;

    const nextDay = new Date(day.date);
    nextDay.setDate(nextDay.getDate() + 1);

    setDates({
      checkIn: day.date,
      checkOut: nextDay.toISOString().split("T")[0],
    });
  }}
  className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold transition
    ${day.isAvailable
      ? "bg-green-50 border-green-200 text-green-700 hover:scale-[1.02]"
      : "bg-red-50 border-red-200 text-red-700 cursor-not-allowed"}
    ${isSelected ? "ring-2 ring-blue-500" : ""}
  `}
>

            <p className="text-xs font-black tracking-wider">
              {day.dayOfWeek}
            </p>
            <p className="text-lg">{day.date}</p>

            <p className="text-[11px] mt-1 font-semibold">
              {day.isAvailable
                ? `${day.availableRooms} room${day.availableRooms > 1 ? "s" : ""} left`
                : "Sold out"}
            </p>
          </div>
        );
      })}
    </div>
  </div>
)}

              {!isAvailable && !availabilityLoading && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-bold text-red-800">These dates aren't available</p>
                    <p className="text-xs text-red-600">Please try selecting different dates for this room.</p>
                  </div>
                </div>
              )}

              {/* GUESTS */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="font-bold text-gray-700">Guests</p>
                  <p className="text-gray-500 text-sm">{totalGuest} guest{totalGuest > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setTotalGuest(Math.max(1, totalGuest - 1))}
                    className="w-10 h-10 border-2 rounded-full flex items-center justify-center hover:border-gray-900 transition font-bold"
                  >-</button>
                  <span className="font-bold w-4 text-center">{totalGuest}</span>
                  <button 
                    onClick={() => setTotalGuest(Math.min(data.room.maxGuests, totalGuest + 1))}
                    className="w-10 h-10 border-2 rounded-full flex items-center justify-center hover:border-gray-900 transition font-bold"
                  >+</button>
                </div>
              </div>
            </div>
          </section>

          {/* PAYMENT MODE */}
          <section className={`${!isAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Choose how to pay</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "STRIPE", label: "Credit/Debit Card/Stripe", icon: <CreditCard /> },
                { id: "RAZORPAY", label: "UPI/Net Banking/Razorpay", icon: <CreditCard /> },
                { id: "COD", label: "Pay at Hotel", icon: <ShieldCheck /> }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMode(m.id)}
                  className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                    paymentMode === m.id ? "border-blue-600 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className={paymentMode === m.id ? "text-blue-600" : "text-gray-400"}>{m.icon}</span>
                  <span className={`text-sm font-bold ${paymentMode === m.id ? "text-blue-700" : "text-gray-600"}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {!bookingId && (
            <button
              onClick={handleBooking}
              disabled={loading || availabilityLoading || !isAvailable}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                !isAvailable 
                ? "bg-gray-300 cursor-not-allowed text-gray-500" 
                : "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
              }`}
            >
              {loading ? "Creating your stay..." : !isAvailable ? "Room Unavailable" : "Confirm Booking"}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN (Summary stays same but adds nights detail) */}
        <div className="lg:col-span-5">
           <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sticky top-24">
             {/* Room Info Section */}
             <div className="flex gap-4 mb-6 pb-6 border-b">
               <img src={data.room.images?.[0]} className="w-24 h-24 object-cover rounded-2xl shadow-sm" alt="Room" />
               <div>
                 <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{data.hotel.name}</p>
                 <h4 className="font-bold text-gray-800 text-lg leading-tight">{data.room.title || data.room.type}</h4>
                 <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mt-2">
                   <Users size={14} className="text-gray-400" /> {totalGuest} Guests • {pricing?.nights || 1} Night{pricing?.nights > 1 ? 's' : ''}
                 </div>
               </div>
             </div>

             {/* Pricing Section */}
             <h3 className="font-bold text-gray-900 mb-4">Price breakdown</h3>
             <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-gray-600">
                  <span>₹{data.room.pricePerDay} x {pricing?.nights || 1} nights</span>
                  <span>₹{pricing?.baseTotal || 0}</span>
                </div>
                
                {offerPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><Ticket size={14}/> Special Offer ({offerPercent}%)</span>
                    <span>-₹{pricing?.offerDiscount}</span>
                  </div>
                )}

                {coupon.applied && (
                  <div className="flex justify-between text-indigo-600">
                    <span>Coupon ({coupon.applied.coupon.code})</span>
                    <span>-₹{coupon.applied.discountAmount}</span>
                  </div>
                )}

                <div className="pt-4 border-t flex justify-between text-xl font-black text-gray-900">
                  <span>Total (INR)</span>
                  <span>₹{pricing?.finalTotal || 0}</span>
                </div>
             </div>

             {/* Coupon Input */}
             <div className="mt-8 pt-6 border-t">
                <p className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Coupons</p>
                <div className="flex gap-2">
                  <input
                    disabled={coupon.applied || offerPercent > 0 || !isAvailable}
                    value={coupon.code}
                    onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })}
                    className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none uppercase font-bold text-sm"
                    placeholder="ENTER CODE"
                  />
                  <button
                    disabled={coupon.loading || coupon.applied || offerPercent > 0 || !isAvailable}
                    onClick={applyCoupon}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition disabled:bg-gray-200"
                  >
                    Apply
                  </button>
                </div>
             </div>

             {/* Payment Mount */}
             {bookingId && (
               <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Payment
                    bookingId={bookingId}
                    totalPrice={pricing.finalTotal}
                    hotelName={data.hotel.name}
                    paymentMode={paymentMode}
                    onSuccess={() => navigate("/payment-success")}
                  />
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoomBook;