import React, { useState } from "react";
import api from "../../../api/axios.config";
import toast from "react-hot-toast";
import { Edit3, Trash2, X, Loader2, Save } from "lucide-react";

const HotelTable = ({ hotels, onRefresh }) => {
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const handleToggleStatus = async (hotelId) => {
    try {
      await api.patch(`/hotels/toggle/status`, { hotelId });
      toast.success("Status Updated");
      onRefresh();
    } catch (err) {
      toast.error("Toggle Failed");
    }
  };

  const handleDelete = async (hotelId) => {
    if (!window.confirm("Permanent Delete?")) return;
    try {
      await api.delete(`/hotels/${hotelId}`);
      toast.success("Hotel Removed");
      onRefresh();
    } catch (err) {
      toast.error("Delete Failed");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
          <tr>
            <th className="px-6 py-4">Hotel Details</th>
            <th className="px-6 py-4">Price</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hotels.map((hotel) => (
            <tr key={hotel._id} className="hover:bg-slate-50/50 transition">
              <td className="px-6 py-4 flex items-center gap-3">
                <img
                  src={hotel.images?.[0] || "/placeholder-hotel.jpg"}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  alt=""
                />
                <div>
                  <p className="font-bold text-slate-800 leading-none mb-1">
                    {hotel.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter">
                    {hotel._id}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 font-black text-slate-700">
                ₹{hotel.basePrice?.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleToggleStatus(hotel._id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition ${
                    hotel.isActive
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {hotel.isActive ? "Active" : "Disabled"}
                </button>
              </td>
              <td className="px-6 py-4 text-right space-x-1">
                <button
                  onClick={() => {
                    setSelectedHotel(hotel);
                    setEditModalOpen(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(hotel._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isEditModalOpen && (
        <EditHotelModal
          hotel={selectedHotel}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

const EditHotelModal = ({ hotel, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: hotel.name,
    basePrice: hotel.basePrice,
    description: hotel.description,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/hotels/update`, { ...formData, hotelId: hotel._id });
      toast.success("Updated!");
      onSuccess();
    } catch (err) {
      toast.error("Update Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Edit Hotel
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
              Hotel Name
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                Base Price (₹)
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                Current Status
              </label>
              <div className="px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 italic text-sm">
                {hotel.isActive ? "Active" : "Disabled"}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-600"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}{" "}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelTable;
