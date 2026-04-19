import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.config";
import {
  Plus,
  MapPin,
  Star,
  Settings2,
  Eye,
  Power,
  Building2,
  LayoutDashboard,
  Search,
  ChevronRight,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

const MyHotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyHotels = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_API_URL}/hotels/my/hotels`,
      );
      if (res.data.success) {
        setHotels(res.data.hotels);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch your hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyHotels();
  }, []);

  const handleToggleStatus = async (hotelId) => {
    try {
      const res = await api.patch(
        `${import.meta.env.VITE_API_URL}/hotels/toggle/status`,
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMyHotels(); // Refresh list
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              <LayoutDashboard className="text-blue-600" size={32} />
              Owner Dashboard
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your listed properties and track their status.
            </p>
          </div>

          <button
            onClick={() => navigate("/list-property")}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-blue-200"
          >
            <Plus size={20} />
            ADD NEW HOTEL
          </button>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Building2 />}
            label="Total Properties"
            value={hotels.length}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp />}
            label="Total Revenue"
            value="₹45,200"
            color="emerald"
          />
          <StatCard
            icon={<Users />}
            label="Total Bookings"
            value="128"
            color="orange"
          />
        </div>

        {/* HOTEL LIST */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
              Your Listings
            </h3>
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none w-64"
                placeholder="Search properties..."
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {hotels.length > 0 ? (
              hotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Image Column */}
                  <div className="w-full md:w-48 h-32 rounded-3xl overflow-hidden shadow-md relative shrink-0">
                    <img
                      src={hotel.images?.[0]}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt=""
                    />
                    <div
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${hotel.isActive ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}
                    >
                      {hotel.isActive ? "Live" : "Draft"}
                    </div>
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <h4 className="text-xl font-black text-slate-900">
                      {hotel.name}
                    </h4>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 text-sm font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {hotel.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star
                          size={14}
                          className="text-yellow-400 fill-yellow-400"
                        />{" "}
                        4.8
                      </span>
                      <span className="text-blue-600 font-bold">
                        ₹{hotel.basePrice}/night
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleToggleStatus(hotel._id)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border ${
                        hotel.isActive
                          ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <Power size={18} />
                      {hotel.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => navigate(`/hotels/${hotel._id}`)}
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all"
                    >
                      <Eye size={20} />
                    </button>

                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                      <Settings2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Building2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No Properties Found
                </h3>
                <p className="text-slate-500 mb-8">
                  You haven't listed any hotels yet. Start earning today!
                </p>
                <button
                  onClick={() => navigate("/list-property")}
                  className="text-blue-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 mx-auto hover:gap-4 transition-all"
                >
                  List your first hotel <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">
          {value}
        </p>
      </div>
    </div>
  );
};

export default MyHotels;
