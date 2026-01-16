import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Calendar, MapPin, Users, CreditCard, 
  CheckCircle2, Clock, AlertCircle, Printer, Share2, ReceiptText
} from "lucide-react";
import Payment from "./Payment";

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMode, setPaymentMode] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate(`/auth?redirect=/bookings/my/${bookingId}`);
          return;
        }

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/bookings/my/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
  }, [bookingId, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium italic">Fetching your itinerary...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-red-50 text-red-700 p-8 rounded-3xl border border-red-100 max-w-md text-center">
        <AlertCircle className="mx-auto mb-4" size={40} />
        <h2 className="text-xl font-bold mb-2">Error Loading Booking</h2>
        <p className="text-sm opacity-80 mb-6">{error}</p>
        <button onClick={() => navigate("/bookings")} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Back to Bookings</button>
      </div>
    </div>
  );

  const statusColors = {
    booked: "bg-emerald-50 text-emerald-700 border-emerald-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    canceled: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 pt-24">
      <div className="max-w-4xl mx-auto px-6 my-20">
        
        {/* TOP NAVIGATION & ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate("/bookings")}
              className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold text-sm">Back to My Bookings</span>
            </button>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Booking Confirmation</h1>
          </div>
          
          <div className="flex gap-3">
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-600">
              <Printer size={20} />
            </button>
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-600">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* MAIN ITINERARY CARD */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            
            {/* IMAGE BANNER */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={booking.roomId.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                alt={booking.roomId.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md bg-white/90 ${statusColors[booking.status]}`}>
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="p-8 md:p-12">
              {/* HEADER INFO */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-10 mb-10">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                    <ReceiptText size={16} />
                    Ref: {booking._id.slice(-8).toUpperCase()}
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">
                    {booking.hotelId.name}
                  </h2>
                  <p className="text-gray-500 flex items-center gap-1.5 font-medium">
                    <MapPin size={18} className="text-gray-400" />
                    {booking.hotelId.address}, {booking.hotelId.city}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 min-w-[200px] text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{booking.totalPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <InfoBlock 
                  icon={<Calendar className="text-blue-500" />} 
                  label="Check-in" 
                  value={new Date(booking.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                />
                <InfoBlock 
                  icon={<Calendar className="text-blue-500" />} 
                  label="Check-out" 
                  value={new Date(booking.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                />
                <InfoBlock 
                  icon={<Users className="text-blue-500" />} 
                  label="Guests" 
                  value={`${booking.totalGuest} Adults`} 
                />
                <InfoBlock 
                  icon={<ReceiptText className="text-blue-500" />} 
                  label="Room Type" 
                  value={booking.roomId.title} 
                />
              </div>

              {/* PAYMENT SECTION - CONDITIONAL */}
              {booking.paymentStatus === "pending" && (
                <div className="mt-12 p-8 bg-blue-600 rounded-[2rem] text-white shadow-lg shadow-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-100">
                        <Clock size={20} />
                        <h3 className="text-xl font-bold">Action Required: Payment Pending</h3>
                      </div>
                      <p className="text-blue-100 text-sm opacity-90 max-w-sm">
                        To secure your room and guarantee your stay, please complete the payment using one of the methods below.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {["COD", "STRIPE", "RAZORPAY"].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPaymentMode(mode)}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            paymentMode === mode
                              ? "bg-white text-blue-600 scale-105 shadow-xl"
                              : "bg-blue-500/30 text-white hover:bg-blue-500/50 border border-blue-400"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMode && (
                    <div className="mt-8 pt-8 border-t border-blue-400/50">
                      <Payment
                        bookingId={booking._id}
                        totalPrice={booking.totalPrice}
                        hotelName={booking.hotelId.name}
                        paymentMode={paymentMode}
                        onSuccess={() => navigate("/bookings")}
                        isEmbedded={true} // Styling flag for Payment component
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* SUB-FOOTER */}
            <div className="bg-gray-50 p-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Booked on {new Date(booking.createdAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                Payment: <span className={booking.paymentStatus === 'pending' ? 'text-rose-500' : 'text-emerald-500'}>{booking.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for clean data presentation
const InfoBlock = ({ icon, label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-base font-bold text-gray-900">{value}</p>
  </div>
);

export default BookingDetails;