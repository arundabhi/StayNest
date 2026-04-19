import React, { useEffect, useState } from "react";
import api from "../api/axios.config";
import { Link } from "react-router-dom";
import HotelCard from "./HotelCard";
import { Sparkles, ArrowRight, Info, RefreshCw } from "lucide-react";

const FeaturedHotel = () => {
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `${import.meta.env.VITE_API_URL}/recommendations/top-rated`,
      );

      if (response.data?.success && Array.isArray(response.data.hotels)) {
        // Limit to top 3 for the premium "Featured" look
        setFeaturedHotels(response.data.hotels.slice(0, 3));
      } else {
        setFeaturedHotels([]);
      }
    } catch (error) {
      console.error("Failed to fetch featured hotels", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Skeleton Loader UI --- */
  const Skeleton = () => (
    <div className="bg-white rounded-[2.5rem] h-[450px] w-full animate-pulse border border-gray-100 p-6 shadow-sm">
      <div className="w-full h-52 bg-gray-100 rounded-[2rem] mb-6" />
      <div className="h-7 bg-gray-100 rounded-full w-3/4 mb-4" />
      <div className="h-4 bg-gray-50 rounded-full w-1/2 mb-8" />
      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
        <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
        <div className="h-12 w-12 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <section className="relative max-w-7xl mx-auto px-6 py-24 overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-blue-50/40 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 -z-10 w-72 h-72 bg-indigo-50/30 blur-[100px] rounded-full" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-black uppercase tracking-[0.2em] mb-6 border border-amber-100 shadow-sm shadow-amber-50/50">
            <Sparkles size={14} fill="currentColor" /> Editor's Choice
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-4">
            Handpicked{" "}
            <span className="text-blue-600 font-serif italic font-medium">
              Treasures
            </span>
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl">
            A curated selection of the highest-rated stays, recognized for
            excellence in service, design, and comfort.
          </p>
        </div>

        <Link
          to="/hotels"
          className="group flex items-center gap-3 bg-white border border-gray-200 pl-8 pr-6 py-4 rounded-[2rem] text-sm font-black uppercase tracking-widest text-gray-800 hover:border-blue-600 hover:text-blue-600 transition-all shadow-xl shadow-gray-100/50 hover:shadow-blue-100/30 active:scale-95"
        >
          Explore All{" "}
          <ArrowRight
            size={20}
            className="group-hover:translate-x-1.5 transition-transform"
          />
        </Link>
      </div>

      {/* GRID CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : featuredHotels.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-24 text-center border-2 border-dashed border-gray-100 shadow-inner flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Info className="text-gray-300" size={40} />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-6">
            No featured stays at the moment
          </p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all active:scale-95"
          >
            <RefreshCw size={18} /> Refresh List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredHotels.map((hotel, index) => (
            <div
              key={hotel._id}
              className="animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both"
              style={{ animationDelay: `${index * 150}ms` }} // Staggered entry
            >
              <HotelCard hotel={hotel} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedHotel;
