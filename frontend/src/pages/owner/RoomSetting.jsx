import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios.config";
import {
  BedDouble,
  Save,
  Trash2,
  Power,
  IndianRupee,
  Users,
  Layers,
  Upload,
  X,
  ArrowLeft,
  BarChart3,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

const RoomSetting = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [room, setRoom] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    pricePerDay: "",
    totalRooms: "",
    maxGuests: "",
    roomType: "Standard",
    amenities: [],
  });

  const [newAmenity, setNewAmenity] = useState("");

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const [roomRes, statsRes] = await Promise.all([
        api.get(`/rooms/${roomId}`),
        api.get(`/rooms/${hotelId}/${roomId}/stats`),
      ]);
      const rData = roomRes.data.room;
      setRoom(rData);
      setFormData({
        title: rData.title,
        pricePerDay: rData.pricePerDay,
        totalRooms: rData.totalRooms,
        maxGuests: rData.maxGuests,
        roomType: rData.roomType,
        amenities: rData.amenities || [],
      });
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error("Failed to load room details");
    } finally {
      setLoading(false);
    }
  };

  // --- Amenities Logic ---
  const addAmenity = () => {
    if (!newAmenity.trim()) return;
    if (formData.amenities.includes(newAmenity.trim()))
      return toast.error("Already exists");
    setFormData({
      ...formData,
      amenities: [...formData.amenities, newAmenity.trim()],
    });
    setNewAmenity("");
  };

  const removeAmenity = (name) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== name),
    });
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Logic matches your updateRoom controller
      await api.put(`/rooms/${hotelId}/${roomId}`, formData);
      toast.success("Inventory updated");
      fetchRoomData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpdate = async (e) => {
    const files = Array.from(e.target.files);
    const data = new FormData();
    files.forEach((file) => data.append("images", file));

    const loadingToast = toast.loading("Processing images...");
    try {
      await api.put(`/rooms/${hotelId}/${roomId}/images`, data);
      toast.success("Gallery replaced", { id: loadingToast });
      fetchRoomData();
    } catch (err) {
      toast.error("Upload failed", { id: loadingToast });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold animate-pulse text-slate-400">
        SYNCING DATA...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FBFDFF] pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold mb-8 transition-all"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT PANEL: STATS & STOCK */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <BarChart3 className="text-blue-600" /> Room Performance
              </h2>
              <div className="space-y-4">
                <StatItem label="Live Occupancy" value={stats?.occupancyRate} />
                <StatItem
                  label="Total Earnings"
                  value={`₹${stats?.totalRevenue.toLocaleString()}`}
                  color="text-emerald-600"
                />
                <StatItem label="Bookings" value={stats?.confirmedBookings} />
                <StatItem label="Physical Units" value={stats?.totalRooms} />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Availability Control
              </h3>
              <button
                onClick={async () => {
                  await api.patch(
                    `/rooms/${hotelId}/${roomId}/toggle-availability`,
                  );
                  fetchRoomData();
                  toast.success("Status toggled");
                }}
                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${
                  room.isAvailable
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                }`}
              >
                <Power size={20} />
                {room.isAvailable ? "DISABLE ROOM" : "ENABLE ROOM"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: CONFIGURATION */}
          <div className="lg:col-span-2 space-y-8">
            <form
              onSubmit={handleUpdateDetails}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-8">
                Inventory Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputField
                    label="Room Category Title"
                    value={formData.title}
                    onChange={(v) => setFormData({ ...formData, title: v })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Type
                  </label>
                  <select
                    value={formData.roomType}
                    onChange={(e) =>
                      setFormData({ ...formData, roomType: e.target.value })
                    }
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 outline-none"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <InputField
                  label="Units (Total Rooms)"
                  type="number"
                  value={formData.totalRooms}
                  onChange={(v) => setFormData({ ...formData, totalRooms: v })}
                />
                <InputField
                  label="Price / Night (₹)"
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(v) => setFormData({ ...formData, pricePerDay: v })}
                />
                <InputField
                  label="Max Guests"
                  type="number"
                  value={formData.maxGuests}
                  onChange={(v) => setFormData({ ...formData, maxGuests: v })}
                />
              </div>

              {/* DYNAMIC AMENITIES */}
              <div className="mt-8 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Room Amenities
                </label>
                <div className="flex gap-2">
                  <input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="e.g. Balcony, Mini Fridge"
                    className="flex-1 px-6 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amt) => (
                    <span
                      key={amt}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-100 animate-in zoom-in-95 duration-200"
                    >
                      {amt}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-rose-500"
                        onClick={() => removeAmenity(amt)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="mt-10 w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />{" "}
                {updating ? "SYNCING..." : "SAVE ALL CHANGES"}
              </button>
            </form>

            {/* IMAGE MANAGEMENT */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <ImageIcon className="text-blue-600" /> Gallery
                </h2>
                <label className="bg-slate-50 text-slate-600 px-6 py-3 rounded-xl font-black text-xs uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <Upload size={16} className="inline mr-2" /> Upload New Set
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleImageUpdate}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {room.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      alt=""
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatItem = ({ label, value, color = "text-slate-900" }) => (
  <div className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0">
    <span className="text-sm font-bold text-slate-500">{label}</span>
    <span className={`text-lg font-black ${color}`}>{value}</span>
  </div>
);

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    />
  </div>
);

export default RoomSetting;
