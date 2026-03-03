import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import RecommendationLayout from "../components/Recommedations/RecommendationLayout";
import toast from "react-hot-toast";
import {
  MapPin, Star, Share, Heart, Coffee, Wifi, Wind, Tv,
  Car, Utensils, Waves, Dumbbell, ChevronLeft, X,
  Users, Gift, Tag, ArrowRight, Calendar, Clock,
  ShieldCheck, Zap, Award, Globe
} from "lucide-react";
import RoomWishlistToggle from "../components/RoomWishlistToggle";

const HotelDetails = () => {
  const { hotelId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [stayDates, setStayDates] = useState({
    checkIn: params.get("checkIn") || "",
    checkOut: params.get("checkOut") || "",
  });
  const [hotelData, setHotelData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [standardOffer, setStandardOffer] = useState(null);
  const [festivalPricing, setFestivalPricing] = useState(null);
  const [similarHotels, setSimilarHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoomType, setSelectedRoomType] = useState("All");

  const checkIn = stayDates.checkIn;
  const checkOut = stayDates.checkOut;
  const guests = params.get("guests") || "1";

  const amenityIcons = {
    wifi: <Wifi size={18} />,
    ac: <Wind size={18} />,
    "air conditioning": <Wind size={18} />,
    tv: <Tv size={18} />,
    breakfast: <Utensils size={18} />,
    coffee: <Coffee size={18} />,
    parking: <Car size={18} />,
    pool: <Waves size={18} />,
    gym: <Dumbbell size={18} />,
    default: <Globe size={18} />,
  };

  const handleDateChange = (field, value) => {
    setStayDates((prev) => ({ ...prev, [field]: value }));
    const newParams = new URLSearchParams(params);
    newParams.set(field, value);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "suites", "amenities", "reviews"];
      const scrollY = window.scrollY + 150;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY && el.offsetTop + el.offsetHeight > scrollY) {
          setActiveTab(id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const [hotelR, roomR, revR, offR, festR, simR] = await Promise.all([
        api.get(`/hotels/${hotelId}`),
        api.get(`/rooms/hotel/${hotelId}`),
        api.get(`/reviews/hotel/${hotelId}`),
        api.get(`/recommendations/offer/${hotelId}`).catch(() => ({ data: { success: false } })),
        api.get(`/pricing/${hotelId}`).catch(() => ({ data: { success: false } })),
        api.get(`/recommendations/similar/${hotelId}`).catch(() => ({ data: { success: false } })),
      ]);
      if (hotelR.data.success) setHotelData(hotelR.data.hotel);
      if (roomR.data.success) setRooms(roomR.data.rooms);
      if (revR.data.success) setReviews(revR.data.reviews);
      if (offR.data.success) setStandardOffer(offR.data.offer);
      if (festR.data.success) setFestivalPricing(festR.data.pricing);
      if (simR.data.success) setSimilarHotels(simR.data.hotels);
    } catch {
      toast.error("Failed to load hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadMasterData();
    window.scrollTo(0, 0);
  }, [loadMasterData]);

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

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      return toast.error("Please select check-in and check-out dates first.");
    }
    try {
      const res = await api.get(`/availability/hotel/${hotelId}/calendar`, {
        params: { checkIn, checkOut, guests: guests || 1 },
      });
      const isAvailable = res.data.calendar?.every((day) => day.availableRooms > 0);
      if (isAvailable) {
        toast.success("Rooms are available for your dates!");
        document.querySelector("#suites")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        toast.error("No rooms available for the selected dates.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not verify availability.");
    }
  };

  const handleBookingRedirect = (roomId) => {
    if (!checkIn || !checkOut) {
      toast.error("Please select stay dates first.");
      return;
    }
    navigate(`/bookings/${hotelId}/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotelData) return null;

  return (
    <main className="bg-gray-50 min-h-screen pt-20 pb-24 mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <button onClick={() => navigate("/hotels")} className="hover:text-indigo-600 transition">
            Hotels
          </button>
          <span>/</span>
          <span className="text-gray-800 font-medium">{hotelData.name}</span>
        </nav>

        {/* TITLE ROW */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{hotelData.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-indigo-500" />
                {hotelData.city}, {hotelData.state}
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <strong className="text-gray-700">{hotelData.avgRating}</strong>
                <span>({hotelData.totalReviews} reviews)</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition"
            >
              <Share size={16} /> Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition">
              <Heart size={16} /> Save
            </button>
          </div>
        </div>

        {/* PHOTO GRID */}
        <div className="mb-10 grid grid-cols-4 grid-rows-2 h-[360px] gap-2 rounded-2xl overflow-hidden relative">
          <div className="col-span-2 row-span-2 overflow-hidden">
            <img
              src={hotelData.images?.[0]}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              alt="Main"
            />
          </div>
          {hotelData.images?.slice(1, 5).map((img, i) => (
            <div key={i} className="hidden sm:block overflow-hidden">
              <img
                src={img}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                alt={`View ${i + 1}`}
              />
            </div>
          ))}
          <button
            onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-semibold text-gray-700 shadow-md hover:bg-white transition"
          >
            View all {hotelData.images?.length} photos
          </button>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-10">

            {/* OFFERS */}
            {(festivalPricing || standardOffer) && (
              <div className="space-y-3">
                {festivalPricing && (
                  <div className="flex items-start gap-4 p-5 bg-orange-50 border border-orange-100 rounded-2xl">
                    <div className="p-2.5 bg-orange-500 text-white rounded-xl shrink-0">
                      <Gift size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-orange-900">
                        {festivalPricing.name} — {dynamicPricing.discount}% off
                      </p>
                      <p className="text-sm text-orange-700 mt-0.5 flex items-center gap-1.5">
                        <Clock size={13} />
                        Valid until {new Date(festivalPricing.endDate).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                )}
                {standardOffer && (
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                      <Tag size={18} />
                    </div>
                    <p className="text-sm font-semibold text-indigo-900">
                      Member offer: Extra {standardOffer.discountPercent}% off applied
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB NAV */}
            <div className="sticky top-16 z-30 bg-gray-50/90 backdrop-blur-md border-b border-gray-200 -mx-4 px-4">
              <div className="flex gap-6 overflow-x-auto">
                {["overview", "suites", "amenities", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => scrollToSection(tab)}
                    className={`py-3 text-sm font-semibold capitalize border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* OVERVIEW */}
            <section id="overview" className="scroll-mt-28 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">About this property</h2>
              <p className="text-gray-600 leading-relaxed">{hotelData.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Verified Safety</p>
                    <p className="text-sm text-gray-500">Health and security protocols verified for 2026.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Award Winning</p>
                    <p className="text-sm text-gray-500">Recognized for outstanding hospitality.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* AMENITIES */}
            <section id="amenities" className="scroll-mt-28 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotelData.amenities?.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                    <span className="text-indigo-500">
                      {amenityIcons[amenity.toLowerCase()] || amenityIcons.default}
                    </span>
                    <span className="text-sm font-medium text-gray-700 capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ROOMS */}
            <section id="suites" className="scroll-mt-28 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
                <div className="flex gap-2 flex-wrap">
                  {["All", "deluxe", "double", "suite"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedRoomType(type)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition border ${
                        selectedRoomType === type
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredSuites.map((room) => {
                  const discountedPrice = festivalPricing
                    ? Math.round(room.pricePerDay * festivalPricing.multiplier)
                    : room.pricePerDay;
                  return (
                    <div
                      key={room._id}
                      className="flex flex-col sm:flex-row bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                      <div className="sm:w-52 h-44 sm:h-auto relative shrink-0 overflow-hidden">
                        <img
                          src={room.images?.[0]}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          alt={room.title}
                        />
                        <div className="absolute top-3 left-3">
                          <RoomWishlistToggle roomId={room._id} />
                        </div>
                        <span className="absolute bottom-3 left-3 bg-black/50 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize">
                          {room.roomType}
                        </span>
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{room.title}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
                            {room.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities?.slice(0, 4).map((a) => (
                              <span
                                key={a}
                                className="px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-100 capitalize"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-end justify-between pt-4 border-t border-gray-50">
                          <div>
                            {festivalPricing ? (
                              <>
                                <p className="text-sm text-gray-400 line-through">
                                  ₹{room.pricePerDay.toLocaleString()}
                                </p>
                                <p className="text-2xl font-bold text-orange-600">
                                  ₹{discountedPrice.toLocaleString()}
                                </p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{room.pricePerDay.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">per night</p>
                          </div>
                          <button
                            onClick={() => handleBookingRedirect(room._id)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition active:scale-95"
                          >
                            Book Now <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">

              {/* PRICE */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-2">
                  <Zap size={13} className="fill-current" /> Instant Confirmation
                </div>
                {festivalPricing ? (
                  <div>
                    <p className="text-sm text-gray-400 line-through">
                      ₹{hotelData.basePrice.toLocaleString()}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-orange-600">
                        ₹{dynamicPricing.finalPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400">/ night</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{hotelData.basePrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400">/ night</span>
                  </div>
                )}
              </div>

              {/* DATE PICKERS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 ring-indigo-400/30">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Check-in
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-500 shrink-0" />
                    <input
                      type="date"
                      className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                      value={stayDates.checkIn}
                      onChange={(e) => handleDateChange("checkIn", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 ring-indigo-400/30">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Check-out
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-500 shrink-0" />
                    <input
                      type="date"
                      className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                      value={stayDates.checkOut}
                      onChange={(e) => handleDateChange("checkOut", e.target.value)}
                      min={stayDates.checkIn || new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>

              {/* GUESTS */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Guests
                  </label>
                  <select
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                    value={guests}
                    onChange={(e) => {
                      const p = new URLSearchParams(params);
                      p.set("guests", e.target.value);
                      navigate({ search: p.toString() }, { replace: true });
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Adult" : "Adults"}
                      </option>
                    ))}
                  </select>
                </div>
                <Users size={18} className="text-gray-300" />
              </div>

              {/* CTA BUTTONS */}
              <button
                onClick={handleCheckAvailability}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition active:scale-95"
              >
                Check Availability
              </button>
              <button
                onClick={() => navigate(`/hotels/chat/${hotelId}`)}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Globe size={16} /> Negotiate Rates
              </button>

              <p className="text-xs text-center text-gray-400">
                Free cancellation on most rooms · No hidden fees
              </p>
            </div>
          </aside>
        </div>

        {/* REVIEWS */}
        <section id="reviews" className="scroll-mt-28 mt-16 pt-10 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Guest Reviews</h2>
              <p className="text-sm text-gray-500">What travelers say about {hotelData.name}</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{hotelData.avgRating}</p>
                <div className="flex gap-0.5 text-amber-400 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{hotelData.totalReviews} reviews</p>
              </div>
              <div className="w-px h-12 bg-gray-100" />
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 w-32">
                    <span className="text-[10px] text-gray-400 w-2">{star}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: star === 5 ? "80%" : star === 4 ? "15%" : "5%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                    {review.userId?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{review.userId?.name}</p>
                    <p className="text-xs text-gray-400">{review.userId?.location || "Verified Traveler"}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{review.message}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400">Jan 2026</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SIMILAR HOTELS */}
        <section className="mt-16 pt-10 border-t border-gray-100">
          <RecommendationLayout
            title="Similar Hotels"
            subtitle="Other properties you might like"
            endpoint={`/recommendations/similar/${hotelId}`}
          />
          {similarHotels.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {similarHotels.slice(0, 3).map((hotel) => (
                <div
                  key={hotel._id}
                  onClick={() => navigate(`/hotels/${hotel._id}`)}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={hotel.images?.[0]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={hotel.name}
                    />
                    <button className="absolute top-3 right-3 p-1.5 bg-white/80 rounded-full text-gray-500 hover:text-red-500 transition">
                      <Heart size={14} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 mb-1">{hotel.name}</h4>
                    <p className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <MapPin size={12} className="text-indigo-500" /> {hotel.city}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={13} fill="currentColor" />
                        <span className="text-sm font-semibold text-gray-700">{hotel.avgRating}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">
                        ₹{hotel.basePrice.toLocaleString()}
                        <span className="text-xs text-gray-400 font-normal">/nt</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* GALLERY MODAL */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-[1000] bg-white overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button
              onClick={() => setShowAllPhotos(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition"
            >
              <ChevronLeft size={20} /> Back to hotel
            </button>
            <p className="text-sm text-gray-500">{hotelData.images?.length} photos</p>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto h-full p-4 sm:p-8 pb-24">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{hotelData.name}</h2>
              <p className="text-sm text-gray-400 mb-8">{hotelData.city}, {hotelData.state}</p>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {hotelData.images?.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden cursor-zoom-in">
                    <img
                      src={img}
                      className="w-full object-cover hover:scale-105 transition-transform duration-500"
                      alt={`Photo ${i + 1}`}
                    />
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