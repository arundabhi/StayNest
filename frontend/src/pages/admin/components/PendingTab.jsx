import React, { useState, useEffect } from "react";
import api from "../../../api/axios.config";
import toast from "react-hot-toast";
import { Clock, Loader2, CheckCircle, XCircle, MapPin, Mail } from "lucide-react";

const PendingTab = ({ refreshData }) => {
  const [pendingHotels, setPendingHotels] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedHotel, setExpandedHotel] = useState(null); // Tracks which hotel detail is open

  const fetchPending = async () => {
    try {
      const res = await api.get("/admin/register-hotels");
      setPendingHotels(res.data.hotels || []);
    } catch (err) {
      toast.error("Error loading requests");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, type) => {
    setActionLoading(id);
    try {
      if (type === "approve") {
        await api.put(`/admin/hotels/${id}/approve`);
        toast.success("Hotel Approved Successfully");
      } else {
        toast.error("Rejection logic requires backend DELETE route.");
      }
      await fetchPending();
      refreshData();
    } catch (err) {
      toast.error("Request Failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Registration Requests
        </h1>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
          {pendingHotels.length} Pending
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingHotels.length > 0 ? (
          pendingHotels.map((hotel) => (
            <div
              key={hotel._id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-300 transition-all"
            >
              {/* Main Summary Row */}
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={hotel.images?.[0] || "/placeholder-hotel.jpg"}
                    className="w-20 h-16 rounded-xl object-cover border border-slate-100 shadow-sm"
                    alt=""
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={12} /> {hotel.city}, {hotel.state}
                      </p>
                      <p className="text-xs font-bold text-blue-600 italic">
                        ₹{hotel.basePrice} / night
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setExpandedHotel(
                        expandedHotel === hotel._id ? null : hotel._id,
                      )
                    }
                    className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-4 py-2"
                  >
                    {expandedHotel === hotel._id
                      ? "Hide Details"
                      : "View All Details"}
                  </button>
                  <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                  <button
                    onClick={() => handleAction(hotel._id, "approve")}
                    disabled={actionLoading === hotel._id}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition shadow-md disabled:opacity-50"
                  >
                    {actionLoading === hotel._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}{" "}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(hotel._id, "reject")}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>

              {/* Collapsible Detail Section */}
              {expandedHotel === hotel._id && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Gallery & Description */}
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Hotel Description
                      </p>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {hotel.description ||
                          "No description provided by owner."}
                      </p>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">
                        Image Gallery
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {hotel.images?.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            className="w-24 h-20 rounded-lg object-cover border border-white shadow-sm flex-shrink-0"
                            alt=""
                          />
                        ))}
                      </div>
                    </div>

                    {/* Meta Data & Amenities */}
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            Owner Contact
                          </p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1 mt-1">
                            <Mail size={12} /> {hotel.owner?.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            Exact Address
                          </p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {hotel.address}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                          Offered Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {hotel.amenities?.map((item, i) => (
                            <span
                              key={i}
                              className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter"
                            >
                              • {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock className="text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              No Pending Requests
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingTab;
