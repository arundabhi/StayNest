import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import RecommendationLayout from "../components/Recommedations/RecommendationLayout";
import toast from "react-hot-toast";

import { 
  MapPin, Star, Shield, Share, Heart, Coffee, Wifi, 
  Wind, Tv, Car, Utensils, Waves, Dumbbell, 
  ChevronLeft, X, Info, CheckCircle2,
  Users
} from "lucide-react";

const HotelDetails = () => {
  const { hotelId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  // Query Params
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guests = params.get("guests");
  
  // States
  const [hotelData, setHotelData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  

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
    default: <Shield size={20} />
  };

  /* ------------------- INTERNAL COMPONENTS ------------------- */

  const RoomWishlistToggle = ({ roomId }) => {
    const [isWished, setIsWished] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);

    useEffect(() => {
      if (!token) return;
      const checkStatus = async () => {
        try {
          const res = await api.get(`${import.meta.env.VITE_API_URL}/wishlists/is-wishlisted/${hotelId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { roomId } 
          });
          setIsWished(res.data.wishlisted);
        } catch (err) { console.error("Check failed", err); }
      };
      checkStatus();
    }, [roomId]);

    const handleToggle = async (e) => {
      e.stopPropagation();
      if (!token) return toast.error("Please login to save suites");
      try {
        setToggleLoading(true);
        const res = await api.post(`${import.meta.env.VITE_API_URL}/wishlists/toggle`, 
          { hotelId, roomId }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsWished(res.data.wished);
        toast.success(res.data.message);
      } catch (error) {
        toast.error(error.message || "Wishlist update failed");
      } finally {
        setToggleLoading(false);
      }
    };

    return (
      <button 
        onClick={handleToggle}
        disabled={toggleLoading}
        className={`absolute top-3 right-3 z-10 p-2.5 rounded-full transition-all border backdrop-blur-md shadow-lg ${
          isWished 
            ? "bg-rose-50 border-rose-100 text-rose-500" 
            : "bg-black/20 border-white/30 text-white hover:bg-white hover:text-rose-500"
        }`}
      >
        <Heart size={18} fill={isWished ? "currentColor" : "none"} className={toggleLoading ? "animate-pulse" : ""} />
      </button>
    );
  };

  /* ------------------- HELPERS & ACTIONS ------------------- */

  const formatIndianDate = (date) => {
    if (!date) return "Select date";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) return toast.error("Select dates in the search bar first!");
    try {
      const res = await api.get(`${import.meta.env.VITE_API_URL}/availability/hotel/${hotelId}/calendar`, {
        params: { checkIn, checkOut, guests },
      });
      const isAvailable = res.data.calendar?.every((day) => day.availableRooms > 0);
      if (isAvailable) {
        toast.success("Suites are available!", { icon: '✨' });
        document.querySelector("#room-section")?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.error("Sold out for these dates.");
      }
    } catch (error) {
      
      toast.error(error.message ||"Check failed"); }
  };

  /* ------------------- DATA FETCHING ------------------- */

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hotelRes, roomRes, reviewRes, offerRes] = await Promise.all([
          api.get(`${import.meta.env.VITE_API_URL}/hotels/${hotelId}`),
          api.get(`${import.meta.env.VITE_API_URL}/rooms/hotel/${hotelId}`),
          api.get(`${import.meta.env.VITE_API_URL}/reviews/hotel/${hotelId}`),
          api.get(`${import.meta.env.VITE_API_URL}/recommendations/offer/${hotelId}`).catch(() => ({ data: { success: false } }))
        ]);
        if (hotelRes.data.success) setHotelData(hotelRes.data.hotel);
        if (roomRes.data.success) setRooms(roomRes.data.rooms);
        if (reviewRes.data.success) setReviews(reviewRes.data.reviews);
        if (offerRes.data.success) setOffer(offerRes.data.offer);
      } catch (err) {
        toast.error(err.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hotelId]);

  // Gallery Scroll Lock
  useEffect(() => {
    document.body.style.overflow = showAllPhotos ? "hidden" : "auto";
  }, [showAllPhotos]);

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
      <p className="text-gray-500 font-medium animate-pulse">Designing your stay...</p>
    </div>
  );

  return (
    <div className="bg-[#FCFCFD] text-gray-900 antialiased min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 pt-24">
        
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl italic font-serif">
              {hotelData.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-2 hover:text-indigo-600 transition cursor-pointer">
                <MapPin size={18} className="text-indigo-600" /> {hotelData.city}, {hotelData.state}
              </span>
              <span className="flex items-center gap-2">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="text-gray-900">{hotelData.avgRating}</span>
                <span className="opacity-50">({hotelData.totalReviews} reviews)</span>
              </span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 font-bold transition hover:bg-gray-50 shadow-sm active:scale-95">
              <Share size={18} /> Share
            </button>
            <button 
              onClick={async () => {
                if(!token) return toast.error("Login to save");
                const res = await api.post(`${import.meta.env.VITE_API_URL}/wishlists/toggle`, { hotelId }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(res.data.message);
              }}
              className="flex items-center gap-2 rounded-2xl border border-gray-900 bg-gray-900 text-white px-6 py-2.5 font-bold transition hover:bg-indigo-600 shadow-xl active:scale-95"
            >
              <Heart size={18} /> Save Hotel
            </button>
          </div>
        </div>

        {/* PHOTO GRID GALLERY */}
        <div className="mb-12 grid grid-cols-1 gap-4 overflow-hidden rounded-[2.5rem] md:grid-cols-4 md:grid-rows-2 md:h-[550px] shadow-2xl shadow-indigo-100">
          <div className="relative col-span-1 row-span-1 md:col-span-2 md:row-span-2 overflow-hidden group">
            <img src={hotelData.images?.[0]} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110 cursor-pointer" alt="Main View" />
          </div>
          {hotelData.images?.slice(1, 5).map((img, i) => (
            <div key={i} className="relative hidden md:block overflow-hidden group border border-white/10">
              <img src={img} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110 cursor-pointer" alt={`View ${i}`} />
            </div>
          ))}
          <button 
            onClick={() => setShowAllPhotos(true)} 
            className="absolute bottom-6 right-6 flex items-center gap-2 rounded-xl border border-gray-900 bg-white px-5 py-2.5 text-sm font-black text-gray-900 shadow-2xl transition hover:bg-gray-100 active:scale-90"
          >
            Show all {hotelData.images?.length} photos
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* OFFER SECTION */}
            {offer && (
              <div className="rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-8 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="rounded-2xl bg-rose-500 p-4 text-white shadow-lg shadow-rose-200">
                    <Shield size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-rose-900 leading-tight">Price Drop: Save {offer.discountPercent}%</h3>
                    <p className="mt-2 text-rose-700 font-medium text-lg">
  Save up to{" "}
  <span className="font-black text-rose-600">
    {offer.discountPercent}%
  </span>{" "}
  on select dates.
</p>
<p className="text-xs text-rose-500 mt-1">
  Final price depends on availability and stay dates.
</p>

                    <div className="mt-4 inline-block rounded-full bg-rose-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                      Offer expires soon
                    </div>
                  </div>
                </div>
              </div>
            )}

            <section className="border-b border-gray-100 pb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-6">About this sanctuary</h2>
              <p className="text-lg leading-relaxed text-gray-500 font-medium italic">
                {hotelData.description}
              </p>
            </section>

            {/* AMENITIES */}
            <section className="border-b border-gray-100 pb-12">
              <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Premier Amenities</h2>
              <div className="grid grid-cols-2 gap-y-6 md:grid-cols-3">
                {hotelData.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-4 text-gray-600 group">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                       {amenityIcons[amenity.toLowerCase()] || amenityIcons.default}
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wide">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SUITES LIST */}
            <section id="room-section" className="space-y-8 scroll-mt-24">
              <div className="flex items-center gap-3">
                 <div className="h-1.5 w-10 bg-indigo-600 rounded-full"></div>
                 <h2 className="text-3xl font-black text-gray-900">Available Suites</h2>
              </div>
              
              {rooms.map((room) => {
                return (
                  <div key={room._id} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white transition-all hover:shadow-2xl hover:shadow-indigo-100/50 md:flex-row">
                    <div className="relative md:w-2/5 overflow-hidden">
                      <img src={room.images?.[0]} className="h-64 w-full object-cover transition duration-1000 group-hover:scale-110" alt={room.title} />
                      <RoomWishlistToggle roomId={room._id} />
                      <div className="absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1 text-[10px] font-black uppercase text-white backdrop-blur-md">
                        {room.roomType}
                      </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between p-8">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">{room.title}</h3>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed line-clamp-3 mb-6 italic">
                          "{room.description}"
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {room.amenities?.slice(0,5).map(a => (
                             <span key={a} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a}</span>
                           ))}
                        </div>
                      </div>
                      
                      <div className="mt-8 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter mb-1">Standard Rate</p>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-gray-900">
  ₹{room.pricePerDay}
</span>

{offer && (
  <span className="ml-2 text-xs font-bold text-rose-500 uppercase">
    Up to {offer.discountPercent}% off
  </span>
)}

                          </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/bookings/${hotelId}/${room._id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
                          className="rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white transition hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95"
                        >
                          Reserve Suite
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          {/* RIGHT STICKY SIDEBAR */}
          <div className="relative">
            <div className="sticky top-28 rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
              <div className="mb-8">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Member Price</p>
                 <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">₹{hotelData.basePrice}</span>
                    <span className="text-gray-400 mb-1.5 font-bold">/ night</span>
                 </div>
              </div>

              <div className="mb-8 space-y-3 rounded-3xl border border-gray-100 p-2 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Check-In</label>
                    <p className="text-sm font-black text-gray-700">{formatIndianDate(checkIn)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Check-Out</label>
                    <p className="text-sm font-black text-gray-700">{formatIndianDate(checkOut)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Travelers</label>
                    <p className="text-sm font-black text-gray-700">{guests || 1} Guest(s)</p>
                  </div>
                  <Users size={20} className="text-indigo-200" />
                </div>
              </div>

              <button 
                onClick={handleCheckAvailability}
                className="w-full rounded-[1.5rem] bg-indigo-600 py-5 text-lg font-black text-white transition-all hover:bg-indigo-700 hover:shadow-2xl shadow-lg shadow-indigo-100 active:scale-95"
              >
                Secure Booking
              </button>

              <button
  onClick={() => navigate(`/hotels/${hotelId}/chat`)}
  className="mt-10 w-full rounded-[1.5rem] bg-indigo-600 py-5 text-lg font-black text-white transition-all hover:bg-indigo-700 hover:shadow-2xl shadow-lg shadow-indigo-100 active:scale-95"
>
  Chat with Hotel
</button>


              <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                 <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                 <p className="text-[11px] font-bold text-emerald-800 leading-tight">Price match guaranteed. No hidden booking fees or taxes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-32">
          <h2 className="text-3xl font-black text-gray-900 mb-12 flex items-center gap-4">
             <Star className="fill-indigo-600 text-indigo-600" size={32} />
             What our guests love
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {reviews.slice(0, 4).map((review) => (
              <div key={review._id} className="bg-white rounded-3xl p-8 border border-gray-50 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-lg">
                    {review.userId?.name?.[0] || "G"}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{review.userId?.name || "Premium Traveler"}</p>
                    <div className="flex items-center gap-1 text-xs text-yellow-500 font-black">
                      <Star size={14} className="fill-current" /> {review.rating}.0
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 leading-relaxed font-medium italic">
                  "{review.message}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SIMILAR RECOMMENDATIONS */}
        <div className="mt-32 space-y-32 border-t border-gray-100 pt-24">
          <RecommendationLayout title="Sanctuaries with similar spirit" endpoint={`/recommendations/similar/${hotelId}`} />
          <RecommendationLayout title="Travelers also sought these stays" endpoint={`/recommendations/also-viewed/${hotelId}`} />
        </div>
      </div>

      {/* FULL SCREEN PHOTO MODAL */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-white overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-white/80 backdrop-blur-xl">
            <button onClick={() => setShowAllPhotos(false)} className="group flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition">
              <ChevronLeft size={28} />
              <span className="font-black text-sm uppercase tracking-tighter">Close Gallery</span>
            </button>
            <div className="flex gap-4">
               <button className="p-3 hover:bg-gray-100 rounded-full transition"><Share size={20}/></button>
               <button className="p-3 hover:bg-gray-100 rounded-full transition text-rose-500"><Heart size={20}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30">
            <div className="mx-auto max-w-6xl">
              <header className="mb-12 text-center">
                <h2 className="text-5xl font-black tracking-tighter text-gray-900">{hotelData.name}</h2>
                <p className="mt-3 text-gray-400 font-bold uppercase tracking-widest text-xs">Exquisite View Collection</p>
              </header>
              <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
                {hotelData.images?.map((img, index) => (
                  <div key={index} className="relative overflow-hidden rounded-[2rem] bg-white shadow-xl hover:brightness-105 transition-all">
                    <img src={img} alt={`Gallery view ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDetails;