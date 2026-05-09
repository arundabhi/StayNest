import React, { useEffect, useState } from "react";
import api from "../api/axios.config";
import {
  ShieldCheck,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import HotelCard from "../components/HotelCard";

const AMENITIES = ["wifi", "parking", "pool", "gym", "spa", "restaurant", "ac"];

const Hotels = () => {
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
        const res = await api.get("/hotels");
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

  if (loading) {
      return (
          <div className="bg-[#FAFBFF] min-h-screen pt-40 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 font-medium">Loading premium stays...</p>
          </div>
      );
  }

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
            <div className="mt-6 bg-white rounded-3xl p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
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
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none"
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
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredHotels.map((hotel) => (
            <HotelCard key={hotel._id} hotel={hotel} />
          ))}
        </div>

        {filteredHotels.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No stays found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;

