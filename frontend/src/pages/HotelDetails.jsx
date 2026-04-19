import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import toast from "react-hot-toast";
import { MapPin, Star, Share, Heart } from "lucide-react";

import HotelPhotoGrid from "../components/HotelDetails/HotelPhotoGrid";
import HotelOverview from "../components/HotelDetails/HotelOverview";
import HotelAmenities from "../components/HotelDetails/HotelAmenities";
import HotelSuites from "../components/HotelDetails/HotelSuites";
import HotelSidebar from "../components/HotelDetails/HotelSidebar";
import HotelReviews from "../components/HotelDetails/HotelReviews";
import SimilarHotelsList from "../components/HotelDetails/SimilarHotelsList";
import HotelGalleryModal from "../components/HotelDetails/HotelGalleryModal";

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
        if (
          el &&
          el.offsetTop <= scrollY &&
          el.offsetTop + el.offsetHeight > scrollY
        ) {
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
        api
          .get(`/recommendations/offer/${hotelId}`)
          .catch(() => ({ data: { success: false } })),
        api
          .get(`/pricing/${hotelId}`)
          .catch(() => ({ data: { success: false } })),
        api
          .get(`/recommendations/similar/${hotelId}`)
          .catch(() => ({ data: { success: false } })),
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
        finalPrice: Math.round(
          hotelData.basePrice * festivalPricing.multiplier,
        ),
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
      const isAvailable = res.data.calendar?.every(
        (day) => day.availableRooms > 0,
      );
      if (isAvailable) {
        toast.success("Rooms are available for your dates!");
        document
          .querySelector("#suites")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        toast.error("No rooms available for the selected dates.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not verify availability.",
      );
    }
  };

  const handleBookingRedirect = (roomId) => {
    if (!checkIn || !checkOut) {
      toast.error("Please select stay dates first.");
      return;
    }
    navigate(
      `/bookings/${hotelId}/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
    );
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
          <button
            onClick={() => navigate("/hotels")}
            className="hover:text-indigo-600 transition"
          >
            Hotels
          </button>
          <span>/</span>
          <span className="text-gray-800 font-medium">{hotelData.name}</span>
        </nav>

        {/* TITLE ROW */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {hotelData.name}
            </h1>
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
        <HotelPhotoGrid
          hotelData={hotelData}
          setShowAllPhotos={setShowAllPhotos}
        />

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-10">
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
            <HotelOverview hotelData={hotelData} />

            {/* AMENITIES */}
            <HotelAmenities hotelData={hotelData} />

            {/* ROOMS */}
            <HotelSuites
              filteredSuites={filteredSuites}
              festivalPricing={festivalPricing}
              selectedRoomType={selectedRoomType}
              setSelectedRoomType={setSelectedRoomType}
              handleBookingRedirect={handleBookingRedirect}
            />
          </div>

          {/* SIDEBAR */}
          <HotelSidebar
            hotelData={hotelData}
            stayDates={stayDates}
            guests={guests}
            params={params}
            navigate={navigate}
            festivalPricing={festivalPricing}
            dynamicPricing={dynamicPricing}
            handleDateChange={handleDateChange}
            handleCheckAvailability={handleCheckAvailability}
            hotelId={hotelId}
          />
        </div>

        {/* REVIEWS */}
        <HotelReviews reviews={reviews} hotelData={hotelData} />

        {/* SIMILAR HOTELS */}
        <SimilarHotelsList similarHotels={similarHotels} navigate={navigate} />
      </div>

      {/* GALLERY MODAL */}
      <HotelGalleryModal
        hotelData={hotelData}
        showAllPhotos={showAllPhotos}
        setShowAllPhotos={setShowAllPhotos}
      />
    </main>
  );
};

export default HotelDetails;
