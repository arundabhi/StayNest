import React, { useEffect, useState } from "react";
import api from "../../api/axios.config";
import {
  IndianRupee,
  Calendar,
  User,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";

const OwnerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" or "pending"
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalPending: 0,
    settledCount: 0,
  });

  const fetchPayments = async (pageNo = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/payment/hotel?page=${pageNo}&limit=10`);
      
      if (res.data.success) {
        setPayments(res.data.payments);
        setHotel(res.data.hotel);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async (pageNo = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/payment/hotel/pending?page=${pageNo}&limit=10`);
      
      if (res.data.success) {
        setPendingPayments(res.data.bookings || []);
        setPendingTotalPages(res.data.totalPages || 1);
        setHotel(res.data.hotel);
      }
    } catch (err) {
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (bookingId) => {
    try {
      const confirmMark = window.confirm("Are you sure you want to mark this booking as paid?");
      if (!confirmMark) return;

      const res = await api.patch(`/bookings/payment/${bookingId}`, {
        paymentStatus: "confirm",
      });

      if (res.data.success) {
        toast.success("Payment marked as successful!");
        // Refresh statistics and active view
        fetchPayments(page);
        fetchPendingPayments(pendingPage);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update payment status");
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchPayments(page);
    } else {
      fetchPendingPayments(pendingPage);
    }
  }, [page, pendingPage, activeTab]);

  const filteredPayments = payments.filter(
    (p) =>
      p.bookingId?.userId?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.paymentMode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredPending = pendingPayments.filter(
    (b) =>
      b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.paymentMode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Wallet className="text-blue-600" size={32} />
              Payment Ledger
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Property:{" "}
              <span className="text-blue-600 font-bold">{hotel?.name}</span> •{" "}
              {hotel?.city}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by Guest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <SummaryCard
            label="Total Earnings"
            value={`₹${stats.totalEarnings.toLocaleString()}`}
            icon={<IndianRupee />}
            color="blue"
          />
          <SummaryCard
            label="Pending (COD)"
            value={`₹${stats.totalPending.toLocaleString()}`}
            icon={<Clock />}
            color="orange"
          />
          <SummaryCard
            label="Settled"
            value={stats.settledCount}
            icon={<CheckCircle2 />}
            color="emerald"
            isCount
          />
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "transactions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Pending Payments
          </button>
        </div>

        {/* PAYMENTS TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          {activeTab === "transactions" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Guest Details
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Stay Period
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Method
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayments.map((payment, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {payment.bookingId?.userId?.name?.charAt(0) || "G"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {payment.bookingId?.userId?.name || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              {payment.bookingId?.userId?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Calendar size={14} className="text-slate-300" />
                          {new Date(
                            payment.bookingId?.checkIn,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                          <span className="text-slate-300 mx-1">→</span>
                          {new Date(
                            payment.bookingId?.checkOut,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {payment.paymentMode}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-900 text-lg">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          <span
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              payment.paymentStatus === "success"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-orange-50 text-orange-600 border-orange-100"
                            }`}
                          >
                            {payment.paymentStatus === "success" ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            {payment.paymentStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPayments.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IndianRupee size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    No transactions found
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Your payment history will appear here once bookings are made.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Guest Details
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Stay Period
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Room Details
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Method
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPending.map((booking, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {booking.userId?.name?.charAt(0) || "G"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {booking.userId?.name || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              {booking.userId?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Calendar size={14} className="text-slate-300" />
                          {new Date(
                            booking.checkIn,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                          <span className="text-slate-300 mx-1">→</span>
                          {new Date(
                            booking.checkOut,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-bold text-slate-700">
                          {booking.roomId?.title || "Standard Room"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">
                          {booking.roomId?.roomType}
                        </p>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {booking.paymentMode}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-900 text-lg">
                          ₹{booking.totalPrice.toLocaleString()}
                        </p>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          <span
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-orange-50 text-orange-600 border-orange-100"
                          >
                            <Clock size={12} />
                            {booking.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleMarkAsPaid(booking._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Mark as Paid
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPending.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    No pending payments
                  </h3>
                  <p className="text-slate-500 text-sm">
                    No active bookings have pending payments currently.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          {/* Prev Button */}
          <button
            onClick={() => {
              if (activeTab === "transactions") {
                setPage((prev) => Math.max(prev - 1, 1));
              } else {
                setPendingPage((prev) => Math.max(prev - 1, 1));
              }
            }}
            disabled={activeTab === "transactions" ? page === 1 : pendingPage === 1}
            className={`px-5 py-2 rounded-lg font-medium transition-all duration-200
              ${(activeTab === "transactions" ? page === 1 : pendingPage === 1)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-white border border-gray-300 hover:bg-gray-100 shadow-sm"
              }`}
          >
            ← Prev
          </button>

          {/* Page Indicator */}
          <div className="px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700 shadow-sm">
            Page {activeTab === "transactions" ? page : pendingPage} of {activeTab === "transactions" ? totalPages : pendingTotalPages}
          </div>

          {/* Next Button */}
          <button
            onClick={() => {
              if (activeTab === "transactions") {
                setPage((prev) => Math.min(prev + 1, totalPages));
              } else {
                setPendingPage((prev) => Math.min(prev + 1, pendingTotalPages));
              }
            }}
            disabled={activeTab === "transactions" ? page >= totalPages : pendingPage >= pendingTotalPages}
            className={`px-5 py-2 rounded-lg font-medium transition-all duration-200
              ${(activeTab === "transactions" ? page >= totalPages : pendingPage >= pendingTotalPages)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md"
              }`}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

// HELPER COMPONENT
const SummaryCard = ({ label, value, icon, color, isCount }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${themes[color]}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <ArrowUpRight
          className="text-slate-200 group-hover:text-slate-400 transition-colors"
          size={20}
        />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
        {value}{" "}
        {isCount && (
          <span className="text-sm font-bold text-slate-400 uppercase ml-1">
            Txns
          </span>
        )}
      </h3>
    </div>
  );
};

export default OwnerPayments;
