import React from "react";
import { Heart, MapPin, Star } from "lucide-react";

const SimilarHotelsList = ({ similarHotels, navigate }) => {
  return (
    <section className="mt-16 pt-10 border-t border-gray-100">
      {similarHotels.length > 0 && (
        <>
          {/* Heading */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Similar Hotels You May Like
              </h2>
              <p className="text-sm text-gray-500">
                Based on price, amenities and ratings
              </p>
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarHotels.slice(0, 3).map((hotel) => (
              <div
                key={hotel._id}
                onClick={() => navigate(`/hotels/${hotel._id}`)}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 cursor-pointer border border-gray-100"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={hotel.images?.[0]}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                  {/* Similarity badge */}
                  <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow">
                    {hotel.similarityScore}% Match
                  </span>

                  {/* Wishlist */}
                  <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full text-gray-600 hover:text-red-500 transition">
                    <Heart size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition">
                    {hotel.name}
                  </h4>

                  <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin size={14} className="text-indigo-500" />
                    {hotel.city}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {hotel.commonAmenities} shared amenities
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                      <Star
                        size={14}
                        fill="currentColor"
                        className="text-amber-400"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {hotel.avgRating || "4.0"}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{hotel.basePrice.toLocaleString()}
                      </p>
                      <span className="text-xs text-gray-400">per night</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default SimilarHotelsList;
