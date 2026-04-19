import React, { useEffect, useState } from "react";
import api from "../api/axios.config";
import {
  Clock,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const UserWaitlist = () => {
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlists = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_API_URL}/waitlists/user`,
      );
      setWaitlists(res.data.waitlists);
    } catch (err) {
      toast.error("Failed to load your waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlists();
  }, []);

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to leave this waitlist?"))
      return;
    try {
      await api.delete(`${import.meta.env.VITE_API_URL}/waitlists/${id}`);
      toast.success("Removed from waitlist");
      setWaitlists((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  if (loading)
    return <div className="p-20 text-center">Loading your waitlists...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 my-10">
      <h1 className="text-3xl font-black mb-8">My Waitlists</h1>

      {waitlists.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed">
          <Clock className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">
            You aren't on any waitlists right now.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {waitlists.map((item) => (
            <div
              key={item._id}
              className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.status === "waiting"
                        ? "bg-amber-100 text-amber-600"
                        : item.status === "promoted"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />{" "}
                  {item.hotelId?.name}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {item.roomId?.type} Room
                </p>
                <div className="flex gap-4 text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />{" "}
                    {new Date(item.checkIn).toLocaleDateString("en-IN")}
                  </span>
                  <span>To</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />{" "}
                    {new Date(item.checkOut).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {item.status === "waiting" && (
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="p-3 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                {item.status === "promoted" && (
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm">
                    Complete Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserWaitlist;
