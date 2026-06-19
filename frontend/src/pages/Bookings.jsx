import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.config";
import toast from "react-hot-toast";
import {
  ArrowRight,
  ChevronDown,
  Calendar,
  MapPin,
  Users,
  Trash2,
  XCircle,
  Info,
} from "lucide-react";
import { 
  useUpcomingBookings, 
  useMyBookings, 
  useCancelBooking, 
  useDeleteBooking 
} from "../hooks/useBookingQueries";
import { useAuth } from "../context/AuthContext";

const Bookings = () => {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();

  // React Query hooks
  const { 
    data: upcomingData, 
    isLoading: loadingUpcoming, 
    error: upcomingError 
  } = useUpcomingBookings();
  
  const { 
    data: allData, 
    isLoading: loadingAll, 
    error: allError 
  } = useMyBookings();

  const cancelMutation = useCancelBooking();
  const deleteMutation = useDeleteBooking();

  const [showAll, setShowAll] = useState(false);

  const upcoming = upcomingData?.upcomingBookings || [];
  const all = allData?.bookings || [];
  const loading = authLoading || loadingUpcoming || loadingAll;
  const error = upcomingError || allError;
  const actionLoading = cancelMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/auth?redirect=/bookings");
    }
  }, [navigate, isLoggedIn, authLoading]);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    try {
      const res = await cancelMutation.mutateAsync(bookingId);
      toast.success(res.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Delete this booking permanently?")) return;
    try {
      const res = await deleteMutation.mutateAsync(bookingId);
      toast.success(res.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete booking");
    }
  };

  /* --- Skeleton Loader Component --- */
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-3 w-2/3">
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/3"></div>
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
      </div>
    </div>
  );

  /* --- Enhanced Booking Card --- */
  const BookingCard = ({ booking }) => {
    const hotelName = booking.hotelId?.name || "Hotel not available";
    const hotelCity = booking.hotelId?.city || "—";
    const statusStyles = {
      booked: "bg-emerald-50 text-emerald-700 border-emerald-100",
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      canceled: "bg-rose-50 text-rose-700 border-rose-100",
    };

    return (
      <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between gap-6">
          {/* Info Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {hotelName}
              </h3>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {hotelCity}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} /> {booking.totalGuest} Guests
              </span>
            </div>

            <div className="inline-flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium text-gray-700">
              <Calendar size={16} className="text-blue-500" />
              <span>
                {new Date(booking.checkIn).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <ArrowRight size={14} className="text-gray-400" />
              <span>
                {new Date(booking.checkOut).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Pricing & Status Section */}
          <div className="flex flex-col justify-between items-end min-w-[140px]">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Amount
              </p>
              <p className="text-2xl font-black text-gray-900">
                ₹{booking.totalPrice.toLocaleString()}
              </p>
              <span
                className={`mt-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyles[booking.status] || "bg-gray-50"}`}
              >
                {booking.status.toUpperCase()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              {booking.status === "booked" && (
                <button
                  onClick={() => cancelBooking(booking._id)}
                  disabled={actionLoading === booking._id}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors tooltip"
                  title="Cancel Booking"
                >
                  <XCircle size={20} />
                </button>
              )}

              {["canceled", "booked"].includes(booking.status) && (
                <button
                  onClick={() => deleteBooking(booking._id)}
                  disabled={actionLoading === booking._id}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              )}

              <button
                onClick={() => navigate(`/bookings/my/${booking._id}`)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
              >
                Details <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl max-w-md text-center border border-red-100">
          <Info className="mx-auto mb-3" size={32} />
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 my-10">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your stays and view your travel history.
          </p>
        </header>

        {/* UPCOMING SECTION */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
            <h2 className="text-xl font-bold text-gray-800">
              Upcoming Adventures
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
              <p className="text-gray-400 font-medium">
                No upcoming trips found.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Find a hotel
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              {upcoming.map((b) => (
                <BookingCard key={b._id} booking={b} />
              ))}
            </div>
          )}
        </section>

        {/* ALL BOOKINGS ACCORDION */}
        <section>
          <button
            onClick={() => setShowAll(!showAll)}
            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all duration-300 ${
              showAll
                ? "bg-white shadow-sm ring-1 ring-gray-100"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span className="font-bold text-gray-700">Booking History</span>
            <ChevronDown
              className={`text-gray-500 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`}
            />
          </button>

          {showAll && (
            <div className="mt-6 grid gap-5 animate-in fade-in slide-in-from-top-4 duration-500">
              {all.length === 0 ? (
                <p className="text-center py-10 text-gray-400 italic">
                  History is empty
                </p>
              ) : (
                all.map((b) => <BookingCard key={b._id} booking={b} />)
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Bookings;
