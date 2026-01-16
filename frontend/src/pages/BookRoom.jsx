import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Calendar, Users, CreditCard, Ticket, CheckCircle, ArrowLeft, 
  AlertCircle, ShieldCheck, Wifi, Coffee, Tv, AirVent, Wind, Languages, Info 
} from "lucide-react";
import Payment from "../components/Payment";

const RoomBook = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const hasShownBlockedToast = useRef(false);

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


  /* ---------------- LOGIC RENDER HELPERS ---------------- */
  if (!data.hotel || !data.room) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 font-medium italic">Preparing your checkout...</p>
    </div>
  );

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 my-20">
        
        {/* BACK NAVIGATION */}
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
          
          {/* LEFT COLUMN: Trip & Room Details */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* TRIP OVERVIEW */}
            <section className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Confirm trip details</h2>
                {!availabilityLoading && dates.checkIn && (
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                    isAvailable ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}>
                    {isAvailable ? "Available Now" : "Currently Blocked"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dates Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Stay Period</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <p className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-blue-600 uppercase">Check-in</p>
                      <input 
                        type="date" 
                        className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition"
                        value={dates.checkIn}
                        onChange={(e) => setDates({...dates, checkIn: e.target.value})}
                      />
                    </div>
                    <div className="relative flex-1">
                      <p className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-blue-600 uppercase">Check-out</p>
                      <input 
                        type="date" 
                        className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition"
                        value={dates.checkOut}
                        onChange={(e) => setDates({...dates, checkOut: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Guest Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Travelers</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700">{totalGuest} Guests</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setTotalGuest(Math.max(1, totalGuest - 1))} className="w-8 h-8 bg-white border rounded-full shadow-sm hover:bg-gray-100 font-bold">-</button>
                      <button onClick={() => setTotalGuest(Math.min(data.room.maxGuests, totalGuest + 1))} className="w-8 h-8 bg-white border rounded-full shadow-sm hover:bg-gray-100 font-bold">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ROOM DETAILS & AMENITIES */}
            <section className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Room Features & Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <AmenityItem icon={<Wifi size={18}/>} label="High Speed WiFi" active={data.room.amenities?.includes("wifi") || true} />
                <AmenityItem icon={<AirVent size={18}/>} label="Air Conditioning" active={true} />
                <AmenityItem icon={<Coffee size={18}/>} label="Breakfast Included" active={offerPercent > 0} />
                <AmenityItem icon={<Tv size={18}/>} label="Smart TV" active={true} />
                <AmenityItem icon={<Languages size={18}/>} label="Room Service" active={true} />
                <AmenityItem icon={<Wind size={18}/>} label="Balcony View" active={data.room.type?.toLowerCase().includes("luxury")} />
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex gap-3 items-start">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Room Information</p>
                  <p className="text-xs text-blue-700 leading-relaxed mt-1">
                    {data.room.description || "This spacious room offers premium bedding, a work desk, and integrated climate control for a comfortable stay."}
                  </p>
                </div>
              </div>
            </section>

            {/* PAYMENT METHOD SELECTION */}
            <section className={!isAvailable ? 'opacity-50 pointer-events-none' : ''}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose how to pay</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "STRIPE", label: "Stripe", sub: "Credit / Debit Card", icon: <CreditCard /> },
                  { id: "RAZORPAY", label: "Razorpay", sub: "UPI / NetBanking", icon: <Languages /> },
                  { id: "COD", label: "Pay at Hotel", sub: "Guarantee stay", icon: <ShieldCheck /> }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMode(m.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      paymentMode === m.id ? "border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className={paymentMode === m.id ? "text-blue-600" : "text-gray-400"}>{m.icon}</div>
                    <p className="font-bold text-gray-900 mt-3">{m.label}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{m.sub}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                {/* Visual Summary */}
                <div className="relative h-40">
                  <img src={data.room.images?.[0]} className="w-full h-full object-cover" alt="Room" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-6">
                    <div>
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">{data.hotel.name}</p>
                      <h4 className="text-white font-bold text-xl">{data.room.title || data.room.type}</h4>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex justify-between items-center">
                    Price Summary
                    <span className="text-xs font-normal text-gray-400">All inclusive</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <span>₹{data.room.pricePerDay} × {pricing?.nights || 1} nights</span>
                      <span>₹{pricing?.baseTotal || 0}</span>
                    </div>

                    {offerPercent > 0 && (
                      <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1"><Ticket size={16}/> Seasonal Discount</span>
                        <span>-₹{pricing?.offerDiscount}</span>
                      </div>
                    )}

                    {coupon.applied && (
                      <div className="flex justify-between text-sm font-bold text-blue-600 bg-blue-50 p-2 rounded-lg">
                        <span>Coupon ({coupon.applied.coupon.code})</span>
                        <span>-₹{coupon.applied.discountAmount}</span>
                      </div>
                    )}

                    <div className="pt-6 border-t border-dashed flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total to pay</p>
                        <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{pricing?.finalTotal || 0}</p>
                      </div>
                      <ShieldCheck className="text-blue-600 opacity-20" size={40} />
                    </div>
                  </div>

                  {/* Coupon Input */}
                  <div className="mt-8">
                    <div className="flex gap-2">
                      <input
                        disabled={coupon.applied || offerPercent > 0 || !isAvailable}
                        value={coupon.code}
                        onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })}
                        className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none uppercase font-bold text-sm transition-all disabled:opacity-50"
                        placeholder="COUPON CODE"
                      />
                      <button
                        disabled={coupon.loading || coupon.applied || offerPercent > 0 || !isAvailable}
                        onClick={applyCoupon}
                        className="bg-gray-900 text-white px-6 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all active:scale-95 disabled:bg-gray-200"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {!bookingId && (
                    <button
                      onClick={handleBooking}
                      disabled={loading || availabilityLoading || !isAvailable}
                      className={`w-full mt-8 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-100 active:scale-[0.98] ${
                        !isAvailable 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {loading ? "Processing..." : !isAvailable ? "Dates Sold Out" : "Book This Room"}
                    </button>
                  )}
                  
                  {bookingId && (
                     <div className="mt-6">
                        <Payment 
                           bookingId={bookingId} 
                           totalPrice={pricing.finalTotal} 
                           hotelName={data.hotel.name} 
                           paymentMode={paymentMode} 
                           onSuccess={() => navigate("/payment-success")} 
                        />
                     </div>
                  )}

                  <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-tighter">
                    Free cancellation before {new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for amenities
const AmenityItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 ${active ? 'text-gray-700' : 'text-gray-300 line-through'}`}>
    <div className={`p-2 rounded-lg ${active ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
      {icon}
    </div>
    <span className="text-xs font-bold">{label}</span>
  </div>
);

export default RoomBook;