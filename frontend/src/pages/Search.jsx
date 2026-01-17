import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import { MapPin } from "lucide-react";

const Search = () => {
  const [params] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const navigate = useNavigate()

  const destination = params.get("destination");
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guests = params.get("guests");

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const res = await api.get("/hotels/search", {
          params: {
            destination,
            checkIn,
            checkOut,
            guests,
          },
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
    return <div className="p-10 text-center">Loading hotels...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        Hotels in {destination}
      </h2>

      {hotels.length === 0 ? (
        <p>No hotels found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div
              key={hotel._id}
              className="border rounded-xl overflow-hidden shadow hover:shadow-lg transition"
            >
              <img
                src={hotel.images?.[0]}
                alt={hotel.name}
                className="h-48 w-full object-cover"
              />

              <div className="p-4">
                <h3 className="font-semibold text-lg">{hotel.name}</h3>

                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} />
                  {hotel.city}, {hotel.state}
                </p>

                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {hotel.description}
                </p>

                <button onClick={()=>navigate(`/hotels/${hotel._id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                  View Rooms
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
