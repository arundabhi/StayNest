import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, ArrowUpRight } from "lucide-react";

const PopularDestination = () => {
  const navigate = useNavigate();

  const destinations = [
    {
      city: "Goa",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      hotelCount: 120,
      rating: 4.6,
      tag: "Coastal Beauty"
    },
    {
      city: "Manali",
      image: "https://images.unsplash.com/photo-1548013146-72479768bada",
      hotelCount: 85,
      rating: 4.5,
      tag: "Mountain Retreat"
    },
    {
      city: "Jaipur",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523",
      hotelCount: 95,
      rating: 4.4,
      tag: "Heritage City"
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      {/* Header with "View All" */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-12">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
            Popular <span className="text-blue-600">Destinations</span>
          </h2>
          <p className="text-gray-500 font-medium max-w-md">
            The most sought-after cities by our travelers, offering hand-picked stays for every style.
          </p>
        </div>
        <button 
          onClick={() => navigate('/hotels')}
          className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
        >
          Explore all <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations.map((dest, index) => (
          <div
            key={index}
            className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] aspect-[4/5] shadow-lg shadow-gray-200"
            onClick={() => navigate(`/hotels?city=${dest.city}`)}
          >
            {/* Background Image */}
            <img
              src={dest.image}
              alt={dest.city}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Top Badge */}
            <div className="absolute top-6 left-6">
              <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                {dest.tag}
              </span>
            </div>

            {/* Content Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-400 mb-2">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">{dest.hotelCount} Properties</span>
                  </div>
                  <h3 className="text-3xl font-black text-white leading-none">
                    {dest.city}
                  </h3>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-3 text-center">
                  <div className="flex items-center gap-1 text-yellow-400 mb-0.5">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm font-bold text-white">{dest.rating}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/60 uppercase">Rating</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularDestination;