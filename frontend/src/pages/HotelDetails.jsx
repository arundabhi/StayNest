import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import RecommendationLayout from "../components/Recommedations/RecommendationLayout";
import toast from "react-hot-toast";
import { 
  MapPin, Star, Shield, Share, Heart, Coffee, Wifi, Wind, Tv, 
  Car, Utensils, Waves, Dumbbell, ChevronLeft, X, Info, 
  CheckCircle2, Users, Gift, Sparkles, Tag, ArrowRight, 
  Calendar, Clock, ShieldCheck, Zap, Award, Globe
} from "lucide-react";
import RoomWishlistToggle from "../components/RoomWishlistToggle";

/**
 * PRODUCTION-GRADE HOTEL DETAILS COMPONENT
 * Handles: Dynamic Pricing, Dual Offers, Review Ecosystem, and Suite Availability
 */
const HotelDetails = () => {
  const { hotelId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
const [stayDates, setStayDates] = useState({
  checkIn: params.get("checkIn") || "",
  checkOut: params.get("checkOut") || ""
});
  // --- STATE MANAGEMENT ---
  const [hotelData, setHotelData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [standardOffer, setStandardOffer] = useState(null); 
  const [festivalPricing, setFestivalPricing] = useState(null);
  const [similarHotels, setSimilarHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoomType, setSelectedRoomType] = useState("All");
  const [reviewFilter, setReviewFilter] = useState("recent");
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);

  // URL Query Params
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const guests = params.get("guests") || "1";

  // --- AMENITY MAPPING ---
  const amenityIcons = {
    wifi: <Wifi size={20} />,
    ac: <Wind size={20} />,
    "air conditioning": <Wind size={20} />,
    tv: <Tv size={20} />,
    breakfast: <Utensils size={20} />,
    coffee: <Coffee size={20} />,
    parking: <Car size={20} />,
    pool: <Waves size={20} />,
    gym: <Dumbbell size={20} />,
    default: <Globe size={20} />
  };
/**
 * Helper to format dates into the Indian Standard (DD/MM/YYYY)
 * @param {string} dateString - ISO date string from params or state
 */

const handleDateChange = (field, value) => {
  setStayDates(prev => ({ ...prev, [field]: value }));
  const newParams = new URLSearchParams(params);
  newParams.set(field, value);
  navigate({ search: newParams.toString() }, { replace: true });
};
const formatIndianDate = (dateString) => {
  if (!dateString) return "Select Date";
  
  const date = new Date(dateString);
  
  // Check if the date is valid to prevent "Invalid Date" UI errors
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
  /* ------------------- DATA FETCHING ENGINE ------------------- */
  
  const loadMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = [
        api.get(`/hotels/${hotelId}`),
        api.get(`/rooms/hotel/${hotelId}`),
        api.get(`/reviews/hotel/${hotelId}`),
        api.get(`/recommendations/offer/${hotelId}`).catch(() => ({ data: { success: false } })),
        api.get(`/pricing/${hotelId}`).catch(() => ({ data: { success: false } })),
        api.get(`/recommendations/similar/${hotelId}`).catch(() => ({ data: { success: false } }))
      ];

      const [hotelR, roomR, revR, offR, festR, simR] = await Promise.all(endpoints);

      if (hotelR.data.success) setHotelData(hotelR.data.hotel);
      if (roomR.data.success) setRooms(roomR.data.rooms);
      if (revR.data.success) setReviews(revR.data.reviews);
      if (offR.data.success) setStandardOffer(offR.data.offer);
      if (festR.data.success) setFestivalPricing(festR.data.pricing);
      if (simR.data.success) setSimilarHotels(simR.data.hotels);

    } catch (err) {
      toast.error("An error occurred while curating your sanctuary details.");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadMasterData();
    window.scrollTo(0, 0);
  }, [loadMasterData]);

  /* ------------------- COMPUTED PROPERTIES (MEMOIZED) ------------------- */

  const dynamicPricing = useMemo(() => {
    if (!hotelData) return { finalPrice: 0, discount: 0 };
    let price = hotelData.basePrice;
    let discount = 0;
    
    if (festivalPricing && festivalPricing.multiplier) {
      price = Math.round(hotelData.basePrice * festivalPricing.multiplier);
      discount = Math.round((1 - festivalPricing.multiplier) * 100);
    }
    return { finalPrice: price, discount };
  }, [hotelData, festivalPricing]);

  const filteredSuites = useMemo(() => {
    if (selectedRoomType === "All") return rooms;
    return rooms.filter(r => r.roomType === selectedRoomType);
  }, [rooms, selectedRoomType]);

  /* ------------------- ACTION HANDLERS ------------------- */
  /**
   * VERIFY ROOM AVAILABILITY
   * Hits the /availability/hotel/:id/calendar endpoint
   */
  const handleCheckAvailability = async () => {
    // 1. Validation: Ensure dates are selected
    if (!checkIn || !checkOut) {
      return toast.error("Please select Check-In and Check-Out dates first!", {
        icon: '📅',
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
    }

    try {
      // 2. API Call: Passing params for the specific stay period
      const res = await api.get(`/availability/hotel/${hotelId}/calendar`, {
        params: { 
          checkIn, 
          checkOut, 
          guests: guests || 1 
        }
      });

      // 3. Logic: Check if every day in the range has at least 1 room available
      const isAvailable = res.data.calendar?.every((day) => day.availableRooms > 0);

      if (isAvailable) {
        toast.success("Suites are available for these dates!", {
          icon: '✨',
          duration: 3000
        });
        
        // 4. UX: Smooth scroll the user down to the Room/Suite section
        document.querySelector("#room-section")?.scrollIntoView({ 
          behavior: "smooth",
          block: "start"
        });
      } else {
        toast.error("Sold out! No suites available for the selected dates.", {
          icon: '🚫'
        });
      }
    } catch (error) {
      console.error("Availability Check Error:", error);
      toast.error(error.response?.data?.message || "Could not verify availability at this time.");
    }
  };

  const handleBookingRedirect = (roomId) => {
    if (!checkIn || !checkOut) {
      toast.error("Please select stay dates in the sidebar first.");
      return;
    }
    navigate(`/bookings/${hotelId}/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  /* ------------------- SUB-COMPONENTS ------------------- */

  const OfferDisplay = () => (
    <div className="space-y-6">
      {festivalPricing && (
        <div className="group rounded-[2.5rem] border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white p-10 shadow-xl transition-all hover:shadow-orange-100">
          <div className="flex items-start gap-8">
            <div className="rounded-3xl bg-orange-600 p-5 text-white shadow-2xl shadow-orange-200 animate-pulse">
              <Gift size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-3xl font-black text-orange-950 uppercase tracking-tighter italic">
                  {festivalPricing.name} Celebration!
                </h3>
                <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Limited Time
                </span>
              </div>
              <p className="text-xl text-orange-800 font-medium">
                Exclusive <span className="font-black underline">{dynamicPricing.discount}% Multiplier</span> applied for all stays booked this week.
              </p>
              <div className="mt-6 flex items-center gap-4 text-orange-600 font-bold text-sm">
                <Clock size={18} /> Valid until {new Date(festivalPricing.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {standardOffer && (
        <div className="rounded-[2.5rem] border border-indigo-100 bg-indigo-50/30 p-8 flex items-center gap-6">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg">
            <Tag size={24} />
          </div>
          <p className="font-bold text-indigo-900 text-lg">
            Personalized Reward: Extra {standardOffer.discountPercent}% Savings Unlocked
          </p>
        </div>
      )}
    </div>
  );

  /* ------------------- MAIN RENDER ------------------- */

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-2xl font-black text-gray-900 uppercase tracking-widest animate-pulse italic">
        Curating Luxury...
      </p>
    </div>
  );

  return (
    <main className="bg-[#FCFCFD] min-h-screen pt-24 pb-32 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* BREADCRUMBS & TOP NAV */}
        <nav className="flex items-center gap-4 mb-8 text-xs font-black uppercase tracking-widest text-gray-400">
          <span className="cursor-pointer hover:text-indigo-600 transition" onClick={() => navigate('/hotels')}>Hotels</span>
          <ChevronLeft size={12} className="rotate-180" />
          <span className="text-gray-900">{hotelData.city} Sanctuary</span>
        </nav>

        {/* HERO HEADER */}
        <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 leading-[0.9] italic font-serif mb-6">
              {hotelData.name}
            </h1>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <MapPin size={20} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-gray-500">{hotelData.city}, {hotelData.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                  <Star size={18} className="fill-amber-500 text-amber-500" />
                  <span className="text-lg font-black text-amber-700">{hotelData.avgRating}</span>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">/ {hotelData.totalReviews} Guest Reviews</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleShare} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xl hover:bg-gray-50 transition active:scale-90">
              <Share size={24} />
            </button>
            <button  className="flex items-center gap-3 px-8 py-4 rounded-3xl bg-gray-900 text-white font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition active:scale-95">
              <Heart size={20} /> Save Sanctuary
            </button>
          </div>
        </header>

        {/* CINEMATIC GALLERY GRID */}
        
        <section className="mb-20 grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 h-[400px] md:h-[650px] gap-4 rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="col-span-1 row-span-1 md:col-span-2 md:row-span-2 relative group cursor-pointer overflow-hidden">
            <img src={hotelData.images?.[0]} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="Main" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {hotelData.images?.slice(1, 5).map((img, i) => (
            <div key={i} className="hidden md:block relative group overflow-hidden cursor-pointer border-2 border-white/5">
              <img src={img} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" alt="Detail" />
            </div>
          ))}
          <button 
            onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-8 right-8 flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-xl rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 shadow-2xl hover:bg-white transition"
          >
            <Globe size={18} /> View All {hotelData.images?.length} Captures
          </button>
        </section>

        {/* MAIN LAYOUT ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* CONTENT SECTION (COL 8) */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* Dynamic Offers */}
            <OfferDisplay />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-12 border-b border-gray-100 sticky top-20 bg-[#FCFCFD]/80 backdrop-blur-xl z-40 py-4">
              {['overview', 'suites', 'amenities', 'reviews'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-black uppercase tracking-[0.2em] transition-all relative py-2 ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute -bottom-4 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            <section id="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="prose prose-xl prose-indigo max-w-none">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-6">The Soul of the Sanctuary</h2>
                <p className="text-2xl leading-relaxed text-gray-500 font-medium italic font-serif">
                  {hotelData.description}
                </p>
              </div>

              {/* Highlights Cloud */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                <div className="flex gap-6 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl h-fit"><ShieldCheck size={32} /></div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg mb-2 uppercase">Verified Safety</h4>
                    <p className="text-gray-400 font-medium leading-relaxed">Top-tier health and security protocols verified for 2026.</p>
                  </div>
                </div>
                <div className="flex gap-6 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl h-fit"><Award size={32} /></div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg mb-2 uppercase">Award Winner</h4>
                    <p className="text-gray-400 font-medium leading-relaxed">Recognized for outstanding hospitality and structural design.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* TAB: AMENITIES */}
            <section id="amenities" className="pt-10 border-t border-gray-50">
               <h3 className="text-2xl font-black text-gray-900 mb-12 uppercase tracking-tighter">Premier Facilities</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6">
                 {hotelData.amenities?.map((amenity, idx) => (
                   <div key={idx} className="flex items-center gap-5 group">
                     <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        {amenityIcons[amenity.toLowerCase()] || amenityIcons.default}
                     </div>
                     <span className="text-sm font-black text-gray-600 uppercase tracking-widest">{amenity}</span>
                   </div>
                 ))}
               </div>
            </section>

            {/* TAB: SUITES (THE ROOMS LIST) */}
            <section id="suites" className="space-y-12 pt-10 border-t border-gray-50">
               <div className="flex justify-between items-end">
                 <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Curated Suites</h3>
                 <div className="flex gap-2">
                   {['All', 'Deluxe', 'Premium', 'Penthouse'].map(type => (
                     <button 
                       key={type}
                       onClick={() => setSelectedRoomType(type)}
                       className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition border ${selectedRoomType === type ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                     >
                       {type}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid gap-10">
                  {filteredSuites.map((room) => {
                    const discountedRoomPrice = festivalPricing ? Math.round(room.pricePerDay * festivalPricing.multiplier) : room.pricePerDay;
                    return (
                      <div key={room._id} className="group flex flex-col lg:flex-row bg-white rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden relative">
                        <div className="lg:w-1/3 h-72 lg:h-auto relative overflow-hidden">
                          <img src={room.images?.[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={room.title} />
                          <RoomWishlistToggle roomId={room._id} />
                          <div className="absolute top-6 left-6 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                            {room.roomType} Suite
                          </div>
                        </div>
                        <div className="flex-1 p-12 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                               <h4 className="text-3xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{room.title}</h4>
                               <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                 <Shield size={14} />
                                 <span className="text-[10px] font-black uppercase">Available</span>
                               </div>
                            </div>
                            <p className="text-lg text-gray-400 font-medium italic mb-8 leading-relaxed line-clamp-2">
                              “{room.description}”
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {room.amenities?.slice(0, 4).map(a => (
                                <span key={a} className="px-4 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-tighter border border-gray-100">{a}</span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-12 flex items-end justify-between border-t border-gray-50 pt-8">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Pricing Structure</p>
                                <div className="flex flex-col">
                                  {festivalPricing ? (
                                    <>
                                      <span className="text-sm text-gray-300 line-through font-bold">₹{room.pricePerDay.toLocaleString()}</span>
                                      <span className="text-4xl font-black text-orange-600 italic tracking-tighter">₹{discountedRoomPrice.toLocaleString()}</span>
                                    </>
                                  ) : (
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">₹{room.pricePerDay.toLocaleString()}</span>
                                  )}
                                  <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">/ Nightly Experience</span>
                                </div>
                             </div>
                             <button 
                               onClick={() => handleBookingRedirect(room._id)}
                               className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-gray-900 transition-all active:scale-90 flex items-center gap-3"
                             >
                               Reserve Now <ArrowRight size={18} />
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </section>
          </div>

          {/* STICKY SIDEBAR ENGINE (COL 4) */}
          <aside className="lg:col-span-4 relative">
  <div className="sticky top-28 bg-white rounded-[3.5rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-gray-50">
    
    {/* 1. PRICE SECTION */}
    <div className="mb-10 text-center">
      <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-600 mb-6">
        <Zap size={14} className="fill-current" />
        <span className="text-[10px] font-black uppercase tracking-widest">Instant Confirmation</span>
      </div>
      
      <div className="flex flex-col items-center">
        {festivalPricing ? (
          <>
            <span className="text-lg text-gray-300 line-through font-bold">
              ₹{hotelData.basePrice.toLocaleString()}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-orange-600 tracking-tighter italic">
                ₹{dynamicPricing.finalPrice.toLocaleString()}
              </span>
              <span className="text-gray-400 font-bold uppercase text-xs">/ Night</span>
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-gray-900 tracking-tighter">
              ₹{hotelData.basePrice.toLocaleString()}
            </span>
            <span className="text-gray-400 font-bold uppercase text-xs">/ Night</span>
          </div>
        )}
      </div>
    </div>

    {/* 2. BOOKING CONTROLS (Dates & Guests) */}
    <div className="space-y-4 mb-10">
      <div className="grid grid-cols-2 gap-4">
        {/* CHECK-IN INPUT */}
        <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 focus-within:ring-2 ring-indigo-500/20 transition-all">
          <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">Arrival</label>
          <div className="relative flex items-center gap-2">
            <Calendar size={14} className="text-indigo-600 absolute pointer-events-none" />
            <input 
              type="date"
              className="w-full bg-transparent font-black text-gray-700 outline-none pl-6 text-sm appearance-none cursor-pointer"
              value={stayDates.checkIn}
              onChange={(e) => handleDateChange('checkIn', e.target.value)}
              min={new Date().toISOString().split("T")[0]} 
            />
          </div>
        </div>

        {/* CHECK-OUT INPUT */}
        <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 focus-within:ring-2 ring-indigo-500/20 transition-all">
          <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">Departure</label>
          <div className="relative flex items-center gap-2">
            <Calendar size={14} className="text-indigo-600 absolute pointer-events-none" />
            <input 
              type="date"
              className="w-full bg-transparent font-black text-gray-700 outline-none pl-6 text-sm appearance-none cursor-pointer"
              value={stayDates.checkOut}
              onChange={(e) => handleDateChange('checkOut', e.target.value)}
              min={stayDates.checkIn || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
      </div>

      {/* GUEST SELECTOR */}
      <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
        <div>
          <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">Travelers</label>
          <select 
            className="bg-transparent font-black text-gray-700 outline-none text-sm cursor-pointer"
            value={guests}
            onChange={(e) => {
              const newParams = new URLSearchParams(params);
              newParams.set('guests', e.target.value);
              navigate({ search: newParams.toString() }, { replace: true });
            }}
          >
            {[1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
            ))}
          </select>
        </div>
        <Users size={20} className="text-indigo-200" />
      </div>
    </div>

    {/* 3. ACTION BUTTONS */}
    <div className="space-y-4">
      <button 
        onClick={handleCheckAvailability}
        className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-xl font-black uppercase tracking-tighter shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
      >
        Unlock Suite Availability
      </button>

      <button 
        onClick={() => navigate(`/hotels/chat/${hotelId}`)}
        className="w-full py-5 bg-gray-900 text-white rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-xl hover:bg-gray-800 transition active:scale-95 flex items-center justify-center gap-3"
      >
        <Globe size={20} /> Negotiate Rates
      </button>
    </div>

    {/* 4. TRUST BADGE */}
    <div className="mt-12 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex gap-4">
      <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
      <p className="text-xs font-bold text-emerald-800 leading-relaxed">
        Sanctuary Price Guarantee: We match any verified rate plus dynamic festival multipliers.
      </p>
    </div>
  </div>
</aside>
        </div>

        {/* ECOSYSTEM: REVIEWS */}
        <section id="reviews" className="mt-40 border-t border-gray-100 pt-32">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
              <div className="max-w-xl">
                 <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-4 italic">The Guest Journal</h2>
                 <p className="text-xl text-gray-400 font-medium font-serif italic">Discover why elite travelers choose {hotelData.name} for their most significant journeys.</p>
              </div>
              <div className="flex items-center gap-12 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                 <div className="text-center">
                    <p className="text-4xl font-black text-gray-900 mb-1">{hotelData.avgRating}</p>
                    <div className="flex gap-1 text-amber-500 mb-1"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                    <p className="text-[10px] font-black uppercase text-gray-300">Sanctuary Score</p>
                 </div>
                 <div className="h-16 w-[1px] bg-gray-100" />
                 <div className="space-y-1">
                    {[5,4,3,2,1].map(star => (
                      <div key={star} className="flex items-center gap-3 w-40">
                         <span className="text-[9px] font-black text-gray-400">{star}</span>
                         <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: star === 5 ? '85%' : star === 4 ? '12%' : '3%' }} />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {reviews.map((review) => (
               <div key={review._id} className="group p-10 bg-white border border-gray-50 rounded-[3rem] shadow-sm hover:shadow-xl transition-all duration-500 relative">
                 <div className="flex items-center gap-5 mb-8">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-xl italic">
                     {review.userId?.name?.[0]}
                   </div>
                   <div>
                     <h5 className="text-xl font-black text-gray-900">{review.userId?.name}</h5>
                     <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">{review.userId?.location || 'Verified Global Traveler'}</p>
                   </div>
                 </div>
                 <blockquote className="text-2xl font-medium text-gray-600 font-serif italic leading-relaxed mb-8">
                   “{review.message}”
                 </blockquote>
                 <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <span className="text-[10px] font-black text-gray-300 uppercase italic">Stayed in Jan 2026</span>
                 </div>
               </div>
             ))}
           </div>
        </section>

        {/* RECOMMENDATIONS ENGINE */}
        <section className="mt-40 border-t border-gray-100 pt-32 space-y-40">
           <RecommendationLayout 
             title="Sanctuaries with Similar Spirits" 
             subtitle="Explore other destinations that align with your refined aesthetic."
             endpoint={`/recommendations/similar/${hotelId}`} 
           />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {similarHotels.slice(0, 3).map(hotel => (
                <div 
                  key={hotel._id} 
                  onClick={() => navigate(`/hotels/${hotel._id}`)}
                  className="group cursor-pointer bg-white border border-gray-50 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700"
                >
                  <div className="h-64 overflow-hidden relative">
                     <img src={hotel.images?.[0]} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={hotel.name} />
                     <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30"><Heart size={16} /></div>
                  </div>
                  <div className="p-8">
                    <h5 className="text-2xl font-black text-gray-900 mb-2 italic tracking-tighter">{hotel.name}</h5>
                    <div className="flex items-center gap-1 text-gray-400 text-[10px] font-black uppercase mb-6 tracking-widest"><MapPin size={12} className="text-indigo-600"/> {hotel.city}</div>
                    <div className="flex justify-between items-end">
                       <div className="flex items-center gap-1 text-amber-500 font-black"><Star size={14} fill="currentColor" /> {hotel.avgRating}</div>
                       <p className="text-2xl font-black text-gray-900">₹{hotel.basePrice.toLocaleString()}<span className="text-xs text-gray-300">/nt</span></p>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </section>

      </div>

      {/* MODAL GALLERY SYSTEM */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-[1000] bg-white overflow-hidden animate-in slide-in-from-right duration-500">
           <div className="flex items-center justify-between p-10 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-2xl z-20">
              <button onClick={() => setShowAllPhotos(false)} className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] hover:text-indigo-600 transition">
                 <ChevronLeft size={32} className="group-hover:-translate-x-2 transition-transform" /> Back to Sanctuary
              </button>
              <div className="flex gap-6">
                 <button className="p-4 hover:bg-gray-100 rounded-full transition"><Share size={24} /></button>
                 <button className="p-4 hover:bg-gray-100 rounded-full transition text-rose-500"><Heart size={24} /></button>
              </div>
           </div>
           <div className="overflow-y-auto h-full p-10 pb-40">
              <div className="max-w-6xl mx-auto space-y-16">
                 <header className="text-center">
                    <h2 className="text-7xl font-black text-gray-900 tracking-tighter italic mb-4 uppercase">{hotelData.name}</h2>
                    <p className="text-xs font-black text-gray-400 tracking-[0.5em] uppercase">The Visual Journal — Curated 2026</p>
                 </header>
                 <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                    {hotelData.images?.map((img, i) => (
                      <div key={i} className="rounded-[2.5rem] overflow-hidden shadow-2xl hover:scale-[1.02] transition-transform cursor-zoom-in group relative">
                         <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={`View ${i}`} />
                         <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2.5rem]" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </main>
  );
};

export default HotelDetails;