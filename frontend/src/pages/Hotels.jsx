import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import {
  MapPin,
  Star,
  Heart,
  ArrowRight,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Gift,
} from "lucide-react";
import toast from "react-hot-toast";

const AMENITIES = ["wifi", "parking", "pool", "gym", "spa", "restaurant", "ac"];

/* ---------------- PRICE COMPONENT ---------------- */

const PriceDisplay = ({ hotelId, basePrice }) => {
  const [festivalOffer, setFestivalOffer] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_API_URL}/pricing/${hotelId}`,
        );
        if (res.data.success && res.data.pricing) {
          setFestivalOffer(res.data.pricing);
        }
      } catch {}
    };
    fetchPricing();
  }, [hotelId]);

  const finalPrice = festivalOffer
    ? basePrice * festivalOffer.multiplier
    : basePrice;

  return (
    <div className="flex flex-col">
      {festivalOffer && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
            <Gift size={10} /> {festivalOffer.name} Offer
          </span>
          <span className="text-xs text-gray-400 line-through font-bold">
            ₹{basePrice.toLocaleString()}
          </span>
        </div>
      )}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-gray-900">
          ₹{finalPrice.toLocaleString()}
        </span>
        <span className="text-gray-400 text-[10px] font-bold uppercase">
          / night
        </span>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

const Hotels = () => {
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [maxPrice, setMaxPrice] = useState(25000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  /* ---------------- FETCH HOTELS ---------------- */

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await api.get(`${import.meta.env.VITE_API_URL}/hotels`);
        if (res.data.success) setHotels(res.data.hotels);
      } catch (err) {
        toast.error("Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredHotels = hotels
    .filter((hotel) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        hotel.name.toLowerCase().includes(searchTerm) ||
        hotel.city.toLowerCase().includes(searchTerm) ||
        hotel.amenities?.some((a) => a.toLowerCase().includes(searchTerm));

      const matchesPrice = hotel.basePrice <= maxPrice;

      const matchesRating = (hotel.avgRating || 4.2) >= minRating;

      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((a) =>
          hotel.amenities?.map((x) => x.toLowerCase()).includes(a),
        );

      return matchesSearch && matchesPrice && matchesRating && matchesAmenities;
    })
    .sort((a, b) => {
      if (sort === "low-high") return a.basePrice - b.basePrice;
      if (sort === "high-low") return b.basePrice - a.basePrice;
      if (sort === "rating") return b.avgRating - a.avgRating;
      return 0;
    });

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const resetFilters = () => {
    setSearch("");
    setSort("");
    setMaxPrice(25000);
    setSelectedAmenities([]);
    setMinRating(0);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-[#FAFBFF] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
            <ShieldCheck size={16} /> Verified Premium Stays
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            Explore Our Stays
          </h1>
        </header>

        {/* SEARCH */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center bg-white rounded-full shadow-xl border p-2">
            <Search size={20} className="ml-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by hotel, city or amenity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-transparent outline-none font-semibold"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* FILTER DRAWER */}
          {showFilters && (
            <div className="mt-6 bg-white rounded-3xl p-8 shadow-xl space-y-8">
              {/* PRICE */}
              <div>
                <label className="block text-xs font-bold uppercase mb-3">
                  Price Range
                </label>
                <input
                  type="range"
                  min="1000"
                  max="30000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="text-sm font-bold text-blue-600 mt-2">
                  Up to ₹{maxPrice.toLocaleString()}
                </div>
              </div>

              {/* RATING */}
              <div>
                <label className="block text-xs font-bold uppercase mb-3">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full p-3 bg-gray-50 rounded-xl"
                >
                  <option value="0">All</option>
                  <option value="3">3★ & above</option>
                  <option value="4">4★ & above</option>
                  <option value="4.5">4.5★ & above</option>
                </select>
              </div>

              {/* AMENITIES */}
              <div>
                <label className="block text-xs font-bold uppercase mb-3">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-3">
                  {AMENITIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        selectedAmenities.includes(a)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {a.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* SORT */}
              <div>
                <label className="block text-xs font-bold uppercase mb-3">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl"
                >
                  <option value="">Default</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              <button
                onClick={resetFilters}
                className="text-rose-500 font-bold text-xs uppercase"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* HOTEL GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHotels.map((hotel) => (
            <div
              key={hotel._id}
              onClick={() => navigate(`/hotels/${hotel._id}`)}
              className="group bg-white rounded-3xl border shadow-sm hover:shadow-xl transition overflow-hidden cursor-pointer"
            >
              <img
                src={
                  hotel.images?.[0] ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                }
                alt={hotel.name}
                className="h-64 w-full object-cover group-hover:scale-105 transition"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{hotel.name}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                  <MapPin size={14} /> {hotel.city}
                </p>

                <div className="flex justify-between items-center">
                  <PriceDisplay
                    hotelId={hotel._id}
                    basePrice={hotel.basePrice}
                  />
                  <div className="bg-gray-900 text-white p-3 rounded-xl">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hotels;
