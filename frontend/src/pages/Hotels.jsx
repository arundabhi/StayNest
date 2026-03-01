import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import { 
  MapPin, Star, Heart, ArrowRight, ShieldCheck, 
  Search, SlidersHorizontal, X, ChevronDown, Filter, Gift, Sparkles 
} from "lucide-react";
import toast from "react-hot-toast";

const AMENITIES = ["wifi", "parking", "pool", "gym", "spa", "restaurant", "ac"];

/* --- SUB-COMPONENT: PRICE & FESTIVAL BADGE --- */
const PriceDisplay = ({ hotelId, basePrice, onPriceUpdate }) => {
  const [festivalOffer, setFestivalOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.get(`${import.meta.env.VITE_API_URL}/pricing/${hotelId}`);
        if (res.data.success && res.data.pricing) {
          setFestivalOffer(res.data.pricing);
          // Update parent state if you want to filter by discounted price
          if(onPriceUpdate) onPriceUpdate(basePrice * res.data.pricing.multiplier);
        }
      } catch (err) {
        // No active festival
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, [hotelId]);

  if (loading) return <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-xl" />;

  const finalPrice = festivalOffer ? basePrice * festivalOffer.multiplier : basePrice;

  return (
    <div className="flex flex-col">
      {festivalOffer ? (
        <>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-bounce">
               <Gift size={10} /> {festivalOffer.name} Offer
             </span>
             <span className="text-xs text-gray-400 line-through font-bold">
               ₹{basePrice.toLocaleString()}
             </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-600">₹{finalPrice.toLocaleString()}</span>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">/ night</span>
          </div>
        </>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-900">₹{basePrice.toLocaleString()}</span>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">/ night</span>
        </div>
      )}
    </div>
  );
};

/* --- MAIN COMPONENT --- */
const Hotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [maxPrice, setMaxPrice] = useState(25000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await api.get(`${import.meta.env.VITE_API_URL}/hotels`);
        if (res.data.success) {
          setHotels(res.data.hotels);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const filteredHotels = hotels
    .filter((hotel) =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.city.toLowerCase().includes(search.toLowerCase())
    )
    .filter((hotel) => hotel.basePrice <= maxPrice) // Note: Complex filtering by discounted price requires pre-fetching all multipliers
    .filter((hotel) => (hotel.avgRating || 4.2) >= minRating)
    .filter((hotel) =>
      selectedAmenities.length === 0
        ? true
        : selectedAmenities.every((a) =>
            hotel.amenities?.map((x) => x.toLowerCase()).includes(a)
          )
    )
    .sort((a, b) => {
      if (sort === "low-high") return a.basePrice - b.basePrice;
      if (sort === "high-low") return b.basePrice - a.basePrice;
      return 0;
    });

  const resetFilters = () => {
    setSearch(""); setSort(""); setMaxPrice(25000); setSelectedAmenities([]); setMinRating(0);
  };

  /* --- INTERNAL WISHLIST TOGGLE --- */
  const WishlistToggle = ({ hotelId }) => {
    const [isWished, setIsWished] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
      if (!token) return;
      const checkStatus = async () => {
        try {
          const res = await api.get(`${import.meta.env.VITE_API_URL}/wishlists/is-wishlisted/${hotelId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsWished(res.data.wishlisted);
        } catch (err) { console.error(err); }
      };
      checkStatus();
    }, [hotelId, token]);

    const handleToggle = async (e) => {
      e.stopPropagation();
      if (!token) return toast.error("Please login to save stays");
      try {
        setActionLoading(true);
        const res = await api.post(`${import.meta.env.VITE_API_URL}/wishlists/toggle`, { hotelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWished(res.data.wished);
        toast.success(res.data.message);
      } catch (error) {
        toast.error("Failed to update wishlist");
      } finally { setActionLoading(false); }
    };

    return (
      <button 
        onClick={handleToggle}
        disabled={actionLoading}
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all border shadow-sm ${
          isWished ? "bg-rose-500 border-rose-500 text-white" : "bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white hover:text-rose-500"
        }`}
      >
        <Heart size={20} fill={isWished ? "currentColor" : "none"} />
      </button>
    );
  };

  const Skeleton = () => (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-64 bg-gray-200" /><div className="p-6 space-y-4"><div className="h-6 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-100 rounded w-1/2" /></div>
    </div>
  );

  return (
    <div className="bg-[#FAFBFF] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
            <ShieldCheck size={16} /> Verified Premium Stays
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">Explore Our Stays</h1>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative group">
            <div className={`flex items-center bg-white rounded-full shadow-2xl border p-2 transition-all ${showFilters ? 'ring-2 ring-blue-500/20' : 'border-gray-100'}`}>
              <div className="pl-4 text-gray-400"><Search size={22} /></div>
              <input
                type="text" placeholder="Search by hotel name or city..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent px-4 py-3 outline-none text-gray-700 font-semibold"
              />
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${showFilters ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
              >
                <SlidersHorizontal size={18} /><span>Filters</span>
              </button>
            </div>

            {/* FILTER DRAWER */}
            <div className={`overflow-hidden transition-all duration-500 ${showFilters ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-4">Price Range</label>
                    <input type="range" min="1000" max="30000" step="500" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="text-sm font-black text-blue-600 mt-2">Up to ₹{maxPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-4">Sort By</label>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm">
                        <option value="">Default</option>
                        <option value="low-high">Price: Low to High</option>
                        <option value="high-low">Price: High to Low</option>
                    </select>
                  </div>
                  <button onClick={resetFilters} className="text-xs font-black uppercase text-rose-500 self-end mb-2">Reset All</button>
              </div>
            </div>
          </div>
        </div>

        {/* HOTEL GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <Skeleton key={i} />)}
          </div>
        ) : filteredHotels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel._id}
                className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
                onClick={() => navigate(`/hotels/${hotel._id}`)}
              >
                <div className="relative h-72 overflow-hidden">
                  <img src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} alt={hotel.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <WishlistToggle hotelId={hotel._id} />
                </div>
                
                <div className="p-7">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{hotel.name}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-amber-700">{hotel.avgRating || "4.2"}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                    <MapPin size={14} className="text-blue-500" /> {hotel.city}
                  </p>
                  
                  {/* DYNAMIC PRICE SECTION */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <PriceDisplay hotelId={hotel._id} basePrice={hotel.basePrice} />
                    <div className="bg-gray-900 text-white p-3.5 rounded-2xl group-hover:bg-orange-600 transition-all shadow-lg">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Search size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-2xl font-bold">No stays found</h3>
            <button onClick={resetFilters} className="text-blue-600 font-bold underline mt-2">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;