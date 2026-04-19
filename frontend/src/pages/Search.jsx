import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import { MapPin, Star, Users, Calendar } from "lucide-react";

const Search = () => {
  const [params] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const destination = params.get("destination");
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guests = params.get("guests");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const res = await api.get("/hotels/search", {
          params: { destination, checkIn, checkOut, guests },
        });
        setHotels(res.data.hotels);
      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [destination, checkIn, checkOut, guests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] mt-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">
          Finding the best stays for you...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 mt-10 mb-20">
      {/* Header Section */}
      <div className="mt-30 pb-6 border-b border-gray-100">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Stays in{" "}
          <span className="text-blue-600 capitalize">
            {destination || "your destination"}
          </span>
        </h2>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl w-fit">
          <div className="flex items-center gap-1">
            <Calendar size={16} className="text-blue-500" />
            <span>
              {checkIn} - {checkOut}
            </span>
          </div>
          <div className="flex items-center gap-1 border-l pl-4 border-gray-300">
            <Users size={16} className="text-blue-500" />
            <span>
              {guests} {guests > 1 ? "Guests" : "Guest"}
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-2xl text-center text-red-600 font-medium">
          {error}
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-xl text-gray-500">
            No properties found matching your criteria.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-blue-600 font-semibold"
          >
            Try a different search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map((hotel) => (
            <div
              key={hotel._id}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={
                    hotel.images?.[0] ||
                    "https://via.placeholder.com/400x300?text=No+Image"
                  }
                  alt={hotel.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                  <div className="flex items-center gap-1">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-xs font-bold text-gray-800">4.8</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-900 leading-tight">
                    {hotel.name}
                  </h3>
                </div>

                <p className="text-gray-500 flex items-center gap-1 text-sm mb-3">
                  <MapPin size={16} className="text-red-400" />
                  {hotel.city}, {hotel.state}
                </p>

                <p className="text-gray-600 text-sm line-clamp-2 mb-6 min-h-[40px]">
                  {hotel.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <span className="text-2xl font-black text-blue-600">
                      ₹{hotel.cheapestPrice || "2,500"}
                    </span>
                    <span className="text-gray-400 text-xs font-medium">
                      {" "}
                      / night
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        `/hotels/${hotel._id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
                      )
                    }
                    className="bg-gray-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors duration-200 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
