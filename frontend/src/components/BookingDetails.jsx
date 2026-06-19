import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Printer,
  Star,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Info,
  X,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(
          `/bookings/my/${bookingId}`
        );

        if (res.data.success) {
          setBooking(res.data.booking);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const getPaymentDetails = async () => {
    try {
      const res = await api.get(
        `/payment/my/${bookingId}`
      );
      setPaymentDetails(res.data.payment);
      setIsPaymentModalOpen(true);
    } catch (err) {
      toast.error("Could not retrieve payment info");
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = new Date(checkOut) - new Date(checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post(
        `/reviews/${booking.hotelId._id}/${booking.roomId._id}`,
        { rating, message: comment }
      );
      toast.success("Review submitted! Thank you.");
      setShowReviewForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">
          Loading Reservation...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-center max-w-md border border-slate-100">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <Info size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Oops!</h2>
          <p className="text-slate-500 mb-8 font-medium">{error}</p>
          <button
            onClick={() => navigate("/bookings")}
            className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all"
          >
            Return to Bookings
          </button>
        </div>
      </div>
    );

  const nights = calculateNights(booking?.checkIn, booking?.checkOut);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 pt-8">
      <div className="max-w-6xl mx-auto px-4 my-20">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <button
              onClick={() => navigate("/bookings")}
              className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-4 font-bold text-xs tracking-widest uppercase"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Travel History
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Booking Details</h1>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                booking.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                booking.status === "canceled" ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
              }`}>
                {booking.status}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate(`/hotels/${booking.hotelId._id}/chat`)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 rounded-2xl border border-slate-200 font-bold text-sm hover:shadow-lg transition-all"
            >
              <MessageSquare size={18} className="text-blue-500" />
              Message Host
            </button>
            <button className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
              <Printer size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CARD */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="relative h-80 md:h-[450px]">
                <img src={booking.roomId.images?.[0]} className="w-full h-full object-cover" alt="Hotel Room" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-4 w-fit">
                    <ShieldCheck size={14} /> Verified Property
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{booking.hotelId.name}</h2>
                  <p className="flex items-center gap-2 text-white/80 font-medium">
                    <MapPin size={18} className="text-blue-400" /> {booking.hotelId.city}, India
                  </p>
                </div>
              </div>

              <div className="p-8 md:p-12">
                {/* DATE SELECTOR DISPLAY */}
                <div className="grid grid-cols-2 border border-slate-100 rounded-3xl overflow-hidden mb-12 shadow-inner bg-slate-50/50">
                  <div className="p-6 border-r border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-In</p>
                    <p className="text-xl font-black text-slate-800">
                      {new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-tighter">After 12:00 PM</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-Out</p>
                    <p className="text-xl font-black text-slate-800">
                      {new Date(booking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-tighter">Before 11:00 AM</p>
                  </div>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-100">
                  <DetailItem icon={<Users />} label="Occupancy" value={`${booking.totalGuest} Guest(s)`} />
                  <DetailItem icon={<Calendar />} label="Total Stay" value={`${nights} Night(s)`} />
                  <DetailItem icon={<Wallet />} label="Payment" value={booking.paymentStatus.toUpperCase()} color="text-emerald-500" />
                </div>

                {/* PAYMENT QUICK ACTION */}
                <div className="mt-10 flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <CreditCard className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Billing Information</p>
                      <p className="text-xs text-slate-500 font-medium">View transaction history and receipt</p>
                    </div>
                  </div>
                  <button 
                    onClick={getPaymentDetails}
                    className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    View Receipt
                  </button>
                </div>

                {/* REVIEW SECTION */}
                {booking.status === "completed" && (
                  <div className="mt-12">
                    {!showReviewForm ? (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-slate-900 text-white p-8 rounded-[2rem] flex items-center justify-between group hover:bg-blue-600 transition-all duration-500 shadow-xl shadow-slate-200"
                      >
                        <div className="flex items-center gap-5 text-left">
                          <div className="bg-white/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                            <Star size={28} fill="white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Leave a Review</h3>
                            <p className="text-white/60 text-sm font-medium">Share your experience at {booking.hotelId.name}</p>
                          </div>
                        </div>
                        <ChevronRight className="opacity-40 group-hover:translate-x-2 transition-transform" />
                      </button>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 text-center">Rate Your Stay</h3>
                        <div className="flex justify-center gap-4 mb-8">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRating(num)}
                              className={`transition-all duration-300 transform hover:scale-125 ${rating >= num ? "text-yellow-400 drop-shadow-md" : "text-slate-200"}`}
                            >
                              <Star size={48} fill={rating >= num ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none mb-6 min-h-[150px] transition-all"
                          placeholder="What made your stay special? (e.g. service, cleanliness, amenities)"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                          >
                            {submittingReview ? "SUBMITTING..." : "POST REVIEW"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 sticky top-10">
              <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">Price Summary</h3>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Base Rate</span>
                  <span>₹{(booking.totalPrice * 0.82).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>GST & Service Tax</span>
                  <span>₹{(booking.totalPrice * 0.18).toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-100 my-6" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                      ₹{booking.totalPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
              </div>

              {booking.paymentStatus === "pending" && (
                <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all transform hover:-translate-y-1 mb-6">
                  COMPLETE PAYMENT
                </button>
              )}

              <div className="p-5 bg-blue-50/50 rounded-2xl flex gap-4 border border-blue-100">
                <Info size={20} className="text-blue-500 shrink-0" />
                <p className="text-[11px] leading-relaxed text-blue-900/70 font-bold uppercase tracking-tight">
                  Need help? Our support team is available 24/7 for booking assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT DETAILS MODAL */}
      {isPaymentModalOpen && paymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative scale-in-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Payment Receipt</h2>
              <p className="text-slate-400 text-sm font-medium">Transaction successful</p>
            </div>
            
            <div className="space-y-4 mb-10">
              <ModalRow label="Transaction ID" value={paymentDetails._id} isId />
              <ModalRow label="Amount Paid" value={`₹${paymentDetails.amount}`} />
              <ModalRow label="Payment Method" value={paymentDetails.paymentMode} isCaps />
              <ModalRow label="Status" value={paymentDetails.paymentStatus} isStatus />
              <ModalRow label="Date" value={new Date(paymentDetails.createdAt).toLocaleString()} />
            </div>

            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value, color = "text-blue-500" }) => (
  <div className="flex items-start gap-4">
    <div className={`bg-slate-50 p-3 rounded-2xl border border-slate-100 ${color}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base font-bold text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

const ModalRow = ({ label, value, isId, isCaps, isStatus }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-50">
    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black text-slate-900 ${isId ? 'font-mono text-[10px] bg-slate-50 px-2 py-1 rounded' : ''} ${isCaps ? 'uppercase' : ''} ${isStatus ? 'text-emerald-600' : ''}`}>
      {value}
    </span>
  </div>
);

export default BookingDetails;