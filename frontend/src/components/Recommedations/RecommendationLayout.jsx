import { useEffect, useState } from "react";
import api from "../../api/axios.config";
import HotelCard from "./HotelCard";

const RecommendationLayout = ({
  title,
  endpoint,
  transform,
  requiresAuth = false,
}) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const headers = {};

        if (requiresAuth) {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            setError("Login required");
            setLoading(false);
            return;
          }
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await api.get(
          `${import.meta.env.VITE_API_URL}${endpoint}`,
          { headers },
        );

        /**
         * Supports ALL your APIs:
         * - hotels
         * - recommendations
         * - offers
         */
        const list =
          res.data.hotels || res.data.recommendations || res.data.offers || [];

        const finalData = transform ? list.map(transform) : list;
        setHotels(finalData);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load recommendations",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [endpoint, transform, requiresAuth]);

  if (loading) {
    return (
      <section className="py-10">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-red-500">{error}</p>
      </section>
    );
  }

  if (hotels.length === 0) {
    return null; // hide section if empty
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel._id}
            hotel={hotel}
            badge={hotel.badge}
            extra={hotel.extra}
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendationLayout;
