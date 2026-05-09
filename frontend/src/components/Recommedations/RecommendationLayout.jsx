import { useEffect, useState } from "react";
import api from "../../api/axios.config";
import HotelCard from "../HotelCard";
import { useAuth } from "../../context/AuthContext";

const RecommendationLayout = ({
  title,
  endpoint,
  transform,
  requiresAuth = false,
}) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Wait for auth to initialize
      if (authLoading) return;

      if (requiresAuth && !isLoggedIn) {
        setError("Login required");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(endpoint);

        const list =
          res.data.hotels || res.data.recommendations || res.data.offers || [];

        const finalData = transform ? list.map(transform) : list;
        setHotels(finalData);
        setError(""); // Clear previous errors
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load recommendations",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [endpoint, transform, requiresAuth, isLoggedIn, authLoading]);

  if (authLoading || loading) {
    return (
      <section className="py-10 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm">
          {error}
        </div>
      </section>
    );
  }

  if (hotels.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {hotels.slice(0, 4).map((hotel) => (
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
