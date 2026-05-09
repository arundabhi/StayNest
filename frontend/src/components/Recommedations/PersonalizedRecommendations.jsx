import React, { useEffect, useState } from "react";
import api from "../../api/axios.config";
import { Sparkles, Info } from "lucide-react";
import toast from "react-hot-toast";
import HotelCard from "../HotelCard";

const PersonalizedRecommendations = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!token) {
          setError("Login required to see your personalized picks.");
          return;
        }

        const res = await api.get("/recommendations/personalized");

        if (res.data.success) {
          setHotels(res.data.recommendations);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load recommendations"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [token]);

  /* --- Skeleton Component --- */
  const Skeleton = () => (
    <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-12 bg-gray-50 rounded-2xl" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] border border-rose-100 inline-block">
          <Info className="mx-auto mb-3" size={32} />
          <p className="font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (hotels?.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Recommended for You
          </h2>
          <p className="text-gray-500 font-medium">
            Intelligence-driven picks for your next stay
          </p>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hotels?.slice(0, 3).map((hotel) => (
          <HotelCard key={hotel._id} hotel={hotel} />
        ))}
      </div>
    </section>
  );
};

export default PersonalizedRecommendations;

