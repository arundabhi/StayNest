import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import { 
  ArrowLeft, Calendar, MapPin, Users, Printer, 
  Star, MessageSquare, ChevronRight, ShieldCheck, 
  Wallet, Info
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
  
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate(`/auth?redirect=/bookings/my/${bookingId}`);
          return;
        }

        const res = await api.get(
          `${import.meta.env.VITE_API_URL}/bookings/my/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          console.log(res.data.booking);
          
          setBooking(res.data.booking);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
const nights = calculateNights(booking?.checkIn, booking?.checkOut);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post(`${import.meta.env.VITE_API_URL}/reviews/${booking.hotelId._id}/${booking.roomId._id}`, {
        rating,
        message: comment
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      toast.success("Review submitted! Thank you.");
      setShowReviewForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium animate-pulse">Fetching your reservation...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center max-w-md">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <Info size={32} />
        </div>
        <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
        <p className="text-red-700 mb-6">{error}</p>
        <button onClick={() => navigate("/bookings")} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Go Back</button>
      </div>
    </div>
  );

  const isStayCompleted = booking.status === "completed";

  return (
    <div className="bg-[#FBFDFF] min-h-screen pb-20 pt-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 my-10">
        
        {/* TOP NAVIGATION & ACTION BAR */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-10">
          <div className="w-full md:w-auto">
            <button 
              onClick={() => navigate("/bookings")} 
              className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-4"
            >
              <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-bold text-sm tracking-wide uppercase">My Travel History</span>
            </button>
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Booking Info</h1>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${
                    booking.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    booking.status === 'canceled' ? 'bg-red-50 text-red-600 border-red-100' : 
                    'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                    {booking.status}
                </span>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate(`/hotels/${booking.hotelId._id}/chat`)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 transition-all border border-slate-200 font-bold text-sm"
            >
              <MessageSquare size={18} className="text-blue-500" />
              Chat with Host
            </button>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors">
              <Printer size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN CONTENT CARD */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="relative h-72 md:h-96">
                <img src={booking.roomId.images?.[0]} className="w-full h-full object-cover" alt="room" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 text-white">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold mb-3 w-fit border border-white/30">
                        <ShieldCheck size={14} />
                        Verified Listing
                    </div>
                    <h2 className="text-3xl font-black">{booking.hotelId.name}</h2>
                    <p className="flex items-center gap-1 opacity-90 font-medium">
                        <MapPin size={16} /> {booking.hotelId.city}, India
                    </p>
                </div>
              </div>

              <div className="p-8 md:p-10">
                {/* CHECK-IN/OUT CARD */}
                <div className="grid grid-cols-2 gap-0 border border-slate-100 rounded-[2rem] overflow-hidden mb-10 shadow-sm">
                    <div className="p-6 bg-slate-50/50 border-r border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-In</p>
                        <p className="text-xl font-black text-slate-800">{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">From 12:00 PM</p>
                    </div>
                    <div className="p-6 bg-slate-50/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-Out</p>
                        <p className="text-xl font-black text-slate-800">{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Until 11:00 AM</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <DetailItem icon={<Users className="text-blue-500" />} label="Guests" value={`${booking.totalGuest} Person(s)`} />
                  <DetailItem icon={<Wallet className="text-blue-500" />} label="Payment" value={booking.paymentStatus.toUpperCase()} />
                  <DetailItem icon={<Calendar className="text-blue-500" />} label="Duration" value={`${nights} Night`} />
                </div>

                {/* REVIEW SECTION */}
                {isStayCompleted && (
                  <div className="mt-12">
                    {!showReviewForm ? (
                      <button 
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between group hover:bg-blue-600 transition-all duration-500"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                             <Star size={24} fill="white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">Leave a Review</h3>
                            <p className="text-white/60 text-sm font-medium">Tell us about your stay at {booking.hotelId.name}</p>
                          </div>
                        </div>
                        <ChevronRight className="opacity-40" />
                      </button>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <h3 className="text-xl font-black text-slate-900 mb-6 text-center">How was your experience?</h3>
                        
                        <div className="flex justify-center gap-3 mb-8">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRating(num)}
                              className={`transition-all duration-300 transform hover:scale-125 ${rating >= num ? 'text-yellow-400 drop-shadow-md' : 'text-slate-300'}`}
                            >
                              <Star size={40} fill={rating >= num ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>

                        <textarea
                          required
                          className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none mb-6 min-h-[120px] transition-all"
                          placeholder="Share your experience..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button 
                            type="submit" 
                            disabled={submittingReview}
                            className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                          >
                            {submittingReview ? "SUBMITTING..." : "POST REVIEW"}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowReviewForm(false)}
                            className="flex-1 bg-white border border-slate-200 text-slate-500 py-4 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
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

          {/* SIDEBAR - PRICE SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sticky top-24">
                <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider">Price Summary</h3>
                
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Room Rate</span>
                        <span>₹{(booking.totalPrice * 0.82).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Service Tax (18%)</span>
                        <span>₹{(booking.totalPrice * 0.18).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-100 my-4" />
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{booking.totalPrice.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                </div>

                {booking.paymentStatus === "pending" && (
                   <button className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all transform hover:-translate-y-1">
                       COMPLETE PAYMENT
                   </button>
                )}

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex gap-3">
                    <Info size={20} className="text-slate-400 shrink-0" />
                    <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                        Need help? Contact our 24/7 support for any issues regarding this booking or payment.
                    </p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-blue-500">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default BookingDetails;