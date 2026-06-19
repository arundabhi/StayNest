import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  User,
  CreditCard,
  ChevronRight,
  Building2,
  ArrowLeftRight,
  Download,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.config";
import { useNavigate } from "react-router-dom";

const HotelBookings = () => {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("bookings"); // "bookings" or "waitlist"
  const [waitlist, setWaitlist] = useState([]);

  useEffect(() => {
    api
      .get("/hotels/my/hotel")
      .then((res) => {
        const ownerHotels = res.data.hotels || [];
        setHotels(ownerHotels);
        if (ownerHotels.length > 0) {
          setHotelId(ownerHotels[0]._id);
        }
      })
      .catch(() => {
        toast.error("Failed to load hotels");
        navigate("/");
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab]);

  const fetchBookings = async (id, resetPage = false) => {
    if (!id) return;
    try {
      setLoading(true);
      setHotelId(id);
      
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
   
      const res = await api.get(`/bookings/hotel/${id}?page=${currentPage}&limit=10&search=${searchQuery}`);
      setBookings(res.data.bookings || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlist = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      setHotelId(id);
      const res = await api.get(`/waitlists/hotel/${id}`);
      if (res.data.success) {
        setWaitlist(res.data.waitlists || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch waitlist");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteWaitlistEntry = async (waitlistId) => {
    try {
      const confirmPromote = window.confirm("Are you sure you want to manually promote this user from the waitlist?");
      if (!confirmPromote) return;

      const res = await api.patch(`/waitlists/promote-entry/${waitlistId}`);
      if (res.data.success) {
        toast.success("Waitlist user promoted and booking confirmed!");
        // Refresh waitlist & bookings
        fetchWaitlist(hotelId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to promote waitlist entry");
    }
  };

  useEffect(() => {
    if (hotelId) {
      if (activeTab === "bookings") {
        fetchBookings(hotelId);
      } else if (activeTab === "waitlist") {
        fetchWaitlist(hotelId);
      }
    }
  }, [page, hotelId, searchQuery, activeTab]);

  const paginatedBookings = bookings;
  const filteredWaitlist = waitlist.filter(
    (w) =>
      w.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.roomId?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Calendar className="text-blue-600" size={32} />
              Reservations
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Manage guest check-ins and booking statuses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Building2
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <select
                value={hotelId}
                onChange={(e) => fetchBookings(e.target.value,true)}
                className="pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none appearance-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[200px]"
              >
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all">
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "bookings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Reservations
          </button>
          <button
            onClick={() => setActiveTab("waitlist")}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "waitlist"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Waitlisted Guests
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by Guest Name or Booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>

        {/* BOOKINGS DATA TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">
                Fetching Data...
              </p>
            </div>
          ) : activeTab === "bookings" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Guest / ID
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Stay Period
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Room Type
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Total Price
                    </th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((b) => (
                      <tr
                        key={b._id}
                        className="group hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-blue-600">
                              {b.userId?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {b.userId?.name}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                ID: {b._id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-sm font-black text-slate-700">
                                {new Date(b.checkIn).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" },
                                )}
                              </p>
                            </div>
                            <ArrowLeftRight
                              size={14}
                              className="text-slate-300"
                            />
                            <div className="text-center">
                              <p className="text-sm font-black text-slate-700">
                                {new Date(b.checkOut).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" },
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-sm font-bold text-slate-600">
                          {b.roomId?.title}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center">
                            <StatusBadge status={b.status} />
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right font-black text-slate-900">
                          ₹{b.totalPrice.toLocaleString()}
                          <p className="text-[9px] text-emerald-500 font-black tracking-widest uppercase">
                            {b.paymentStatus}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm group-hover:shadow">
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-8 py-20 text-center text-slate-400 font-medium"
                      >
                        No reservations found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Guest Details
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Stay Period
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Room Details
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Guests Count
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredWaitlist.length > 0 ? (
                    filteredWaitlist.map((w) => (
                      <tr
                        key={w._id}
                        className="group hover:bg-orange-50/30 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                              {w.userId?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {w.userId?.name || "Guest"}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {w.userId?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-black text-slate-700">
                              {new Date(w.checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </p>
                            <ArrowLeftRight size={14} className="text-slate-300" />
                            <p className="text-sm font-black text-slate-700">
                              {new Date(w.checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-sm font-bold text-slate-700">
                            {w.roomId?.title || "Room"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">
                            {w.roomId?.roomType}
                          </p>
                        </td>
                        <td className="px-6 py-6 text-center font-black text-slate-900">
                          {w.totalGuest} Guests
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Waitlisted
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handlePromoteWaitlistEntry(w._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Confirm Booking
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-8 py-20 text-center text-slate-400 font-medium"
                      >
                        No waitlisted guests found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {activeTab === "bookings" && bookings.length > 0 && (
          <div className="flex items-center justify-between mt-6 px-4">
            {/* LEFT INFO */}
            <p className="text-sm text-slate-500 font-medium">
              Page {page} of {totalPages}
            </p>

            {/* RIGHT PAGINATION */}
            <div className="flex items-center gap-4">
              {/* Prev */}
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-xl font-semibold transition-all
                  ${page === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                  }`}
              >
                ← Prev
              </button>

              {/* Page */}
              <div className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 shadow-sm">
                Page {page} / {totalPages || 1}
              </div>

              {/* Next */}
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className={`px-4 py-2 rounded-xl font-semibold transition-all
                  ${page >= totalPages
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
    </div>
  );
};

// HELPER COMPONENTS
const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-orange-50 text-orange-600 border-orange-100",
    booked: "bg-blue-50 text-blue-600 border-blue-100",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    canceled: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}
    >
      {status}
    </span>
  );
};

export default HotelBookings;
