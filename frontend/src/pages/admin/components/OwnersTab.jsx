import React, { useState, useEffect } from "react";
import api from "../../../api/axios.config";
import toast from "react-hot-toast";
import { Loader2, Hotel, Trash2, X, MapPin } from "lucide-react";

const OwnersTab = ({ hotelsList = [] }) => {
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOwners = async () => {
    try {
      setLoadingOwners(true);
      const res = await api.get("/admin/get-all-owner");
      setOwners(res.data.owners || []);
    } catch (err) {
      toast.error("Failed to load owners");
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleDeleteOwner = async (ownerId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this owner? This action cannot be undone.",
      )
    )
      return;

    setDeletingId(ownerId);
    try {
      await api.delete(`/admin/owners/${ownerId}`);
      toast.success("Owner deleted successfully");
      setOwners((prev) => prev.filter((owner) => owner._id !== ownerId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete owner");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewHotel = (ownerId) => {
    const hotel = hotelsList?.find(
      (h) => h.owner?._id === ownerId || h.owner === ownerId,
    );

    if (hotel) {
      setSelectedHotel(hotel);
      setShowModal(true);
    } else {
      toast.error("This owner hasn't registered a hotel yet.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">
        Platform Owners
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loadingOwners ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Owner Name</th>
                <th className="px-6 py-4">Contact Email</th>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {owners.map((owner) => (
                <tr key={owner._id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {owner.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{owner.email}</td>
                  <td className="px-6 py-4">
                    {hotelsList?.some(
                      (h) =>
                        h.owner?._id === owner._id || h.owner === owner._id,
                    ) ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                        Has Property
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                        No Property
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleViewHotel(owner._id)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
                      >
                        <Hotel size={14} /> View
                      </button>

                      <button
                        onClick={() => handleDeleteOwner(owner._id)}
                        disabled={deletingId === owner._id}
                        className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete Owner"
                      >
                        {deletingId === owner._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const HotelDetailModal = ({ hotel, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
      <div className="relative h-64">
        <img
          src={hotel.images?.[0] || "/placeholder-hotel.jpg"}
          className="w-full h-full object-cover"
          alt={hotel.name}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition"
        >
          <X size={20} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-2xl font-black text-white">{hotel.name}</h2>
          <p className="text-white/80 flex items-center gap-1 text-sm">
            <MapPin size={14} /> {hotel.address}, {hotel.city}
          </p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Base Price
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">
              ₹{hotel.basePrice}{" "}
              <span className="text-xs font-medium text-slate-500">/night</span>
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Platform Status
            </p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${hotel.isApproved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
            >
              {hotel.isApproved ? "Approved" : "Pending Approval"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Description
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            {hotel.description || "No description provided."}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Amenities
          </p>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities?.map((item, i) => (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-blue-100"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default OwnersTab;
