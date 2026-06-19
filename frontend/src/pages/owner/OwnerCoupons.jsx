import React, { useState, useEffect } from "react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";
import { Ticket, Loader2, Trash2, X, Save, Pencil, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const OwnerCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    expiryDate: "",
    usageLimit: 1,
    minimumBookingAmount: 0,
    hotelId: "",
  });

  const [editFormData, setEditFormData] = useState({
    _id: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    expiryDate: "",
    usageLimit: 1,
    minimumBookingAmount: 0,
    hotelId: "",
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coupons/owner/all?page=${page}&limit=8`);
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setCoupons([]);
        setTotalPages(1);
      } else {
        toast.error("Error loading coupons");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await api.get("/hotels/my/hotel");
      if (res.data.success) {
        const ownerHotels = res.data.hotels || [];
        setHotels(ownerHotels);
        if (ownerHotels.length > 0) {
          setFormData((prev) => ({ ...prev, hotelId: ownerHotels[0]._id }));
        }
      }
    } catch (err) {
      console.error("Error loading hotels:", err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleToggleStatus = async (couponId) => {
    setActionLoading(couponId);
    try {
      const res = await api.patch(`/coupons/${couponId}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message || "Status updated");
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Are you sure you want to permanently delete this coupon?")) return;
    setActionLoading(couponId);
    try {
      const res = await api.delete(`/coupons/${couponId}`);
      if (res.data.success) {
        toast.success("Coupon removed successfully");
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      return toast.error("Coupon code is required");
    }
    if (formData.discountType === "PERCENTAGE" && Number(formData.discountValue) > 100) {
      return toast.error("Percentage discount cannot exceed 100%");
    }
    if (Number(formData.discountValue) <= 0) {
      return toast.error("Discount value must be greater than 0");
    }
    if (new Date(formData.expiryDate) <= new Date()) {
      return toast.error("Expiry date must be in the future");
    }
    if (!formData.hotelId) {
      return toast.error("Please select a hotel for the coupon");
    }

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        expiryDate: formData.expiryDate,
        usageLimit: Number(formData.usageLimit),
        minimumBookingAmount: Number(formData.minimumBookingAmount),
        hotelId: formData.hotelId,
      };

      const res = await api.post("/coupons/create", payload);

      if (res.data.success) {
        toast.success("Coupon created successfully!");
        setShowCreateModal(false);
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          expiryDate: "",
          usageLimit: 1,
          minimumBookingAmount: 0,
          hotelId: hotels.length > 0 ? hotels[0]._id : "",
        });
        setPage(1);
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    }
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();

    if (editFormData.discountType === "PERCENTAGE" && Number(editFormData.discountValue) > 100) {
      return toast.error("Percentage discount cannot exceed 100%");
    }
    if (Number(editFormData.discountValue) <= 0) {
      return toast.error("Discount value must be greater than 0");
    }
    if (new Date(editFormData.expiryDate) <= new Date()) {
      return toast.error("Expiry date must be in the future");
    }
    if (!editFormData.hotelId) {
      return toast.error("Please select a hotel");
    }

    try {
      const payload = {
        discountType: editFormData.discountType,
        discountValue: Number(editFormData.discountValue),
        expiryDate: editFormData.expiryDate,
        usageLimit: Number(editFormData.usageLimit),
        minimumBookingAmount: Number(editFormData.minimumBookingAmount),
        hotelId: editFormData.hotelId,
      };

      const res = await api.put(`/coupons/${editFormData._id}`, payload);

      if (res.data.success) {
        toast.success("Coupon updated successfully!");
        setShowEditModal(false);
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update coupon");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-12 px-4 sm:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Ticket className="text-blue-600" size={32} />
              Manage Coupons
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Create and manage promotional discounts for your properties
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg"
          >
            <Plus size={18} /> Create New Coupon
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-20 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center bg-white rounded-3xl">
              <Ticket className="text-slate-200 mb-6" size={64} />
              <h3 className="text-lg font-bold text-slate-800">No Coupons Available</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-1">
                You haven't created any coupons yet. Click the button above to launch your first coupon.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-5">Code</th>
                    <th className="px-6 py-5">Discount</th>
                    <th className="px-6 py-5">Min. Booking</th>
                    <th className="px-6 py-5">Usage Limit</th>
                    <th className="px-6 py-5">Property</th>
                    <th className="px-6 py-5">Expiry Date</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((coupon) => {
                    const isExpired = new Date(coupon.expiryDate) < new Date();
                    return (
                      <tr key={coupon._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-5 font-mono font-bold text-blue-600 text-base">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-800">
                          {coupon.discountType === "PERCENTAGE" 
                            ? `${coupon.discountValue}%` 
                            : `₹${coupon.discountValue.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-5 text-slate-600">
                          ₹{coupon.minimumBookingAmount?.toLocaleString() || "0"}
                        </td>
                        <td className="px-6 py-5 text-slate-600 font-medium">
                          {coupon.usedCount || 0} / {coupon.usageLimit}
                        </td>
                        <td className="px-6 py-5 text-slate-600 font-semibold">
                          {coupon.hotelId?.name || "Global"}
                        </td>
                        <td className="px-6 py-5 text-slate-600">
                          {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-5">
                          {isExpired ? (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-tighter">
                              Expired
                            </span>
                          ) : coupon.isActive ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-tighter">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-tighter">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleToggleStatus(coupon._id)}
                              disabled={actionLoading === coupon._id || isExpired}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                                coupon.isActive 
                                  ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100" 
                                  : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {coupon.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => {
                                const formattedDate = coupon.expiryDate 
                                  ? new Date(coupon.expiryDate).toISOString().split("T")[0]
                                  : "";
                                setEditFormData({
                                  _id: coupon._id,
                                  code: coupon.code,
                                  discountType: coupon.discountType,
                                  discountValue: coupon.discountValue,
                                  expiryDate: formattedDate,
                                  usageLimit: coupon.usageLimit,
                                  minimumBookingAmount: coupon.minimumBookingAmount || 0,
                                  hotelId: coupon.hotelId?._id || coupon.hotelId || "",
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                              title="Edit Coupon"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon._id)}
                              disabled={actionLoading === coupon._id}
                              className="p-1.5 text-red-400 hover:text-red-600 transition disabled:opacity-50"
                              title="Delete Coupon"
                            >
                              {actionLoading === coupon._id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-xl font-bold text-xs bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition animate-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-xs font-bold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-xl font-bold text-xs bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition animate-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Create New Coupon
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Discount Type
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                    placeholder={formData.discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Min Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.minimumBookingAmount}
                    onChange={(e) => setFormData({ ...formData, minimumBookingAmount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                  Target Hotel Property
                </label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={formData.hotelId}
                  onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                >
                  <option value="" disabled>Select a Hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel._id} value={hotel._id}>
                      {hotel.name} ({hotel.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-black transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Edit Coupon - {editFormData.code}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateCoupon} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Discount Type
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={editFormData.discountType}
                    onChange={(e) => setEditFormData({ ...editFormData, discountType: e.target.value })}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={editFormData.discountType === "PERCENTAGE" ? "100" : undefined}
                    placeholder={editFormData.discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={editFormData.discountValue}
                    onChange={(e) => setEditFormData({ ...editFormData, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={editFormData.usageLimit}
                    onChange={(e) => setEditFormData({ ...editFormData, usageLimit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                    Min Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={editFormData.minimumBookingAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, minimumBookingAmount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                  Target Hotel Property
                </label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={editFormData.hotelId}
                  onChange={(e) => setEditFormData({ ...editFormData, hotelId: e.target.value })}
                >
                  <option value="" disabled>Select a Hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel._id} value={hotel._id}>
                      {hotel.name} ({hotel.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={editFormData.expiryDate}
                  onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-black transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Update Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCoupons;
