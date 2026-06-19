import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Trash2,
  Save,
  Camera,
  ChevronRight,
  ShieldCheck,
  X,
  Star,
  MessageSquare,
  Calendar,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser, logout } = useAuth();


  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", mobileNumber: "" });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    newPassword: "",
  });

  const [activeTab, setActiveTab] = useState("settings"); // "settings", "reviews", "payments"
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const fetchMyReviews = async (page = 1) => {
    try {
      setReviewsLoading(true);
      const res = await api.get(`/reviews/user/me?page=${page}`);
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        setReviewsTotalPages(res.data.pagination?.totalPages || 1);
        setReviewsTotalCount(res.data.pagination?.totalReviews || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data.success) {
        toast.success("Review deleted successfully");
        fetchMyReviews(reviewsPage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    }
  };

  const fetchMyPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await api.get("/payment/my");
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch payments");
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchMyReviews(reviewsPage);
    } else if (activeTab === "payments") {
      fetchMyPayments();
    }
  }, [activeTab, reviewsPage]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        mobileNumber: user.mobileNumber || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/profile");
    }
  }, [user, loading, navigate]);

  const handleUpdateProfile = async () => {
    try {
      const res = await api.put(
        "/users/update",
        form
      );
      await refreshUser();
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.put(
        "/users/change-password",
        passwordForm
      );
      setPasswordForm({ password: "", newPassword: "" });
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password update failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await api.delete("/users/delete");
      logout();
      navigate("/auth");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 my-10">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Settings
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Manage your account details and security preferences.
          </p>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-gray-200 mb-8 gap-6 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("settings");
              setReviewsPage(1);
            }}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === "settings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === "reviews"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            My Reviews ({reviewsTotalCount})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === "payments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            My Payments
          </button>
        </div>

        {activeTab === "settings" ? (
          <div className="grid grid-cols-1 gap-8">
            {/* 1. BASIC INFORMATION CARD */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-100">
                        {user.name?.charAt(0)}
                      </div>
                      <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-50 text-blue-600 hover:scale-110 transition-transform">
                        <Camera size={18} />
                      </button>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {user.name}
                      </h2>
                      <p className="text-gray-500 font-medium">{user.email}</p>
                      <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        <ShieldCheck size={12} /> Verified Member
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      editing
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-600 text-white shadow-lg shadow-blue-100"
                    }`}
                  >
                    {editing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        disabled={!editing}
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-gray-700 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        disabled={!editing}
                        value={form.mobileNumber}
                        onChange={(e) =>
                          setForm({ ...form, mobileNumber: e.target.value })
                        }
                        placeholder="Enter mobile number"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-gray-700 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="mt-8 pt-6 border-t border-gray-50">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
                    >
                      <Save size={18} /> Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. SECURITY CARD */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Lock size={20} className="text-blue-600" /> Security Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  className="bg-white border-2 border-gray-900 text-gray-900 px-6 py-3 rounded-2xl font-bold hover:bg-gray-900 hover:text-white transition-all active:scale-95"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* 3. DANGER ZONE */}
            <div className="bg-rose-50/50 rounded-[2rem] border border-rose-100 overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-lg font-bold text-rose-900">Danger Zone</h3>
                  <p className="text-rose-600/70 text-sm font-medium">
                    Permanently remove your account and all associated data.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 text-rose-600 hover:bg-rose-600 hover:text-white border-2 border-rose-200 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
                >
                  <Trash2 size={18} /> Delete Account
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "reviews" ? (
          <div className="space-y-6">
            {reviewsLoading ? (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-20 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">
                  Loading Reviews...
                </p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8 relative hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => handleDeleteReview(rev._id)}
                      className="absolute top-6 right-6 p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition active:scale-95 border border-rose-100"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="mb-4 pr-12">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {rev.hotelId?.name || "Hotel"}
                      </h3>
                      <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
                        {rev.hotelId?.city} {rev.roomId?.title ? `• ${rev.roomId.title}` : ""}
                      </p>
                    </div>

                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                    </div>

                    <blockquote className="text-gray-600 italic leading-relaxed text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                      "{rev.message}"
                    </blockquote>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                      <Calendar size={14} />
                      <span>
                        Written on{" "}
                        {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {reviewsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 px-4">
                    <p className="text-sm text-slate-500 font-medium">
                      Page {reviewsPage} of {reviewsTotalPages}
                    </p>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setReviewsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reviewsPage === 1}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all
                          ${reviewsPage === 1
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                          }`}
                      >
                        ← Prev
                      </button>

                      <div className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 shadow-sm">
                        {reviewsPage} / {reviewsTotalPages}
                      </div>

                      <button
                        onClick={() => setReviewsPage((prev) => Math.min(prev + 1, reviewsTotalPages))}
                        disabled={reviewsPage >= reviewsTotalPages}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all
                          ${reviewsPage >= reviewsTotalPages
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                          }`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                <MessageSquare className="text-slate-300" size={48} />
                <span>You haven't written any reviews yet.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {paymentsLoading ? (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-20 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">
                  Loading Payment History...
                </p>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                {payments.map((pay) => {
                  const booking = pay.bookingId || {};
                  const hotel = booking.hotelId || {};
                  const statusStyles = {
                    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
                    pending: "bg-amber-50 text-amber-600 border-amber-100",
                    failed: "bg-rose-50 text-rose-600 border-rose-100",
                  };

                  return (
                    <div
                      key={pay._id}
                      className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8 relative hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {hotel.name || "Hotel Booking"}
                          </h3>
                          <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
                            {hotel.city} {booking.roomId?.title ? `• ${booking.roomId.title}` : ""}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              statusStyles[pay.paymentStatus] || "bg-slate-50 border-slate-100 text-slate-500"
                            }`}
                          >
                            {pay.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold text-slate-600 mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Amount
                          </p>
                          <p className="text-slate-900 font-extrabold text-base">
                            ₹{pay.amount?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Payment Mode
                          </p>
                          <p className="text-slate-900 font-bold">{pay.paymentMode}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Transaction Date
                          </p>
                          <p className="text-slate-900 font-medium">
                            {new Date(pay.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Stay Period
                          </p>
                          <p className="text-slate-900 font-medium text-xs">
                            {booking.checkIn
                              ? new Date(booking.checkIn).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "—"}{" "}
                            -{" "}
                            {booking.checkOut
                              ? new Date(booking.checkOut).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {pay.transactionId && (
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                          <span>Transaction ID:</span>
                          <span className="font-mono text-slate-600 select-all">
                            {pay.transactionId}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                <CreditCard className="text-slate-300" size={48} />
                <span>No payment history found.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
