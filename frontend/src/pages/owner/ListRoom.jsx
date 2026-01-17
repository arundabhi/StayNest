import React, { useEffect, useState } from "react";
import { 
  Building2, BedDouble, IndianRupee, Users, 
  Layers, Power, Trash2, Settings, 
  ImageIcon, AlertCircle, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.config";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate

const RoomList = () => {
  const navigate = useNavigate(); // 2. Initialize navigate
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/hotels/my/hotel")
      .then(res => {
        const ownerHotels = res.data.hotels || [];
        setHotels(ownerHotels);
        if (ownerHotels.length > 0) {
          fetchRooms(ownerHotels[0]._id);
        }
      })
      .catch(() => toast.error("Failed to load hotels"));
  }, []);

  const fetchRooms = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      setHotelId(id);
      const res = await api.get(`/rooms/hotel/${id}`);
      setRooms(res.data.rooms || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (roomId) => {
    try {
      await api.patch(`/rooms/${hotelId}/${roomId}/toggle-availability`);
      toast.success("Availability updated");
      fetchRooms(hotelId);
    } catch {
      toast.error("Operation failed");
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm("Permanently delete this room category?")) return;
    try {
      await api.delete(`/rooms/${hotelId}/${roomId}`);
      toast.success("Room deleted");
      fetchRooms(hotelId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete room");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDFF] pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & SELECTOR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Layers className="text-blue-600" size={32} />
              Inventory Management
            </h1>
            <p className="text-slate-500 font-medium mt-1">Manage room categories, pricing, and availability.</p>
          </div>

          <div className="w-full md:w-auto relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={hotelId}
              onChange={(e) => fetchRooms(e.target.value)}
              className="w-full md:min-w-[250px] pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none appearance-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm cursor-pointer"
            >
              <option value="">Select Property...</option>
              {hotels.map(h => (
                <option key={h._id} value={h._id}>{h.name} ({h.city})</option>
              ))}
            </select>
          </div>
        </div>

        {/* ROOM CARDS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-64 bg-slate-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.length > 0 ? rooms.map(room => (
              <div key={room._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group overflow-hidden">
                <div className="p-8">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{room.title}</h3>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{room.roomType}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      room.isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {room.isAvailable ? 'Active' : 'Blocked'}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <InfoBlock icon={<IndianRupee size={14}/>} label="Price" value={`₹${room.pricePerDay}`} />
                    <InfoBlock icon={<Layers size={14}/>} label="Stock" value={room.totalRooms} />
                    <InfoBlock icon={<Users size={14}/>} label="Capacity" value={room.maxGuests} />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ImageIcon size={16} />
                      <span className="text-xs font-bold">{room.images?.length || 0} Photos</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* 3. NEW EDIT BUTTON: Navigates to RoomSetting */}
                      <button 
                        onClick={() => navigate(`/owner/hotel/${hotelId}/room/${room._id}/settings`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                      >
                        <Settings size={14} />
                        Edit Details
                      </button>

                      <button 
                        onClick={() => toggleAvailability(room._id)}
                        className={`p-2.5 rounded-xl transition-all ${
                          room.isAvailable 
                          ? 'bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                        title="Toggle Visibility"
                      >
                        <Power size={18} />
                      </button>

                      <button 
                        onClick={() => deleteRoom(room._id)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <BedDouble size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No rooms found</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Start by adding your first room category to this property.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoBlock = ({ icon, label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-slate-400">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-800">{value}</p>
  </div>
);

export default RoomList;