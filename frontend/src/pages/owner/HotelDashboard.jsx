import React, { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Users,
  Calendar,
  IndianRupee,
  Star,
  LayoutDashboard,
  Download,
  Wallet,
  BedDouble,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Quote,
  X,
} from "lucide-react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const OwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    revenueChart: [],
    bookingDistribution: [],
    dailyBookings: [],
    roomPerformance: [],
    reviewAnalytics: null,
    paymentAnalytics: null,
    guestAnalytics: null,
  });
  const navigate = useNavigate();

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsData, setReviewsData] = useState([]);
  const [reviewsPagination, setReviewsPagination] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [modalRatingBreakdown, setModalRatingBreakdown] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState("monthly");
  const [activePaymentView, setActivePaymentView] = useState("methods");

  const fetchReviews = async (pageNo = 1) => {
    try {
      setReviewsLoading(true);
      const hotelId = data.overview?.hotel?._id;
      if (!hotelId) return;

      const res = await api.get(`/reviews/hotel/${hotelId}?page=${pageNo}`);
      if (res.data.success) {
        setReviewsData(res.data.reviews || []);
        setReviewsPagination(res.data.pagination || null);
      }
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRatingBreakdown = async () => {
    try {
      const hotelId = data.overview?.hotel?._id;
      if (!hotelId) return;

      const res = await api.get(`/reviews/hotel/${hotelId}/rating`);
      if (res.data.success) {
        setModalRatingBreakdown(res.data);
      }
    } catch (err) {
      console.error("Failed to load rating breakdown", err);
    }
  };

  useEffect(() => {
    if (showReviewsModal) {
      fetchReviews(reviewsPage);
    }
  }, [showReviewsModal, reviewsPage]);

  useEffect(() => {
    if (showReviewsModal) {
      fetchRatingBreakdown();
    }
  }, [showReviewsModal]);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const sseRef = useRef(null);
  const location = useLocation();

  const { user } = useAuth();
  
  useEffect(() => {
    let ownerId;

    const connectSSE = async () => {
      try {
        if (!user) return;
        ownerId = user._id;

        if (sseRef.current) return; // prevent duplicate connections

        const es = new EventSource(
          `/chats/sse/${ownerId}`,
        );

        es.onopen = () => {
          console.log("🟢 SSE Connected");
        };

        es.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "new-message") {
            const chat = data.chat;

            // Only notify for user messages
            if (chat.sender !== "user") return;

            // Don't show popup if already in chat page
            if (location.pathname.includes("/owner/hotel/chat")) return;

            // 🔊 Play notification sound
            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => {});

            // 🔥 Professional clickable toast
            toast(
              (t) => (
                <div
                  onClick={() => {
                    navigate(`/owner/chat/${chat.hotelId}`);
                    toast.dismiss(t.id);
                  }}
                  className="cursor-pointer"
                >
                  <p className="font-bold">📩 {chat.userId?.name || "Guest"}</p>
                  <p className="text-sm opacity-80 truncate max-w-xs">
                    {chat.message}
                  </p>
                </div>
              ),
              {
                duration: 5000,
                style: {
                  borderRadius: "12px",
                  background: "#111",
                  color: "#fff",
                },
              },
            );
          }
        };

        es.onerror = () => {
          console.log("🔴 SSE Disconnected. Reconnecting...");
          es.close();
          sseRef.current = null;

          setTimeout(connectSSE, 3000);
        };

        sseRef.current = es;
      } catch (error) {
        console.error("SSE setup failed:", error);
      }
    };

    connectSSE();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [navigate, location]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [ov, rev, dist, daily, room, review, pay, guest] =
        await Promise.all([
          api.get("/analytics/dashboard/overview"),
          api.get("/analytics/revenue/chart"),
          api.get("/analytics/bookings/distribution"),
          api.get("/analytics/bookings/daily-trend"),
          api.get("/analytics/rooms/performance"),
          api.get("/analytics/reviews"),
          api.get("/analytics/payments"),
          api.get("/analytics/guests"),
        ]);

      setData({
        overview: ov.data.overview,
        revenueChart: rev.data.chartData,
        bookingDistribution: dist.data.chartData,
        dailyBookings: daily.data.chartData,
        roomPerformance: room.data.rooms,
        reviewAnalytics: review.data.analytics,
        paymentAnalytics: pay.data.analytics,
        guestAnalytics: guest.data.analytics,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard analytics");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-xs">
            Generating Insights...
          </p>
        </div>
      </div>
    );

  const {
    overview,
    revenueChart,
    bookingDistribution,
    dailyBookings,
    roomPerformance,
    reviewAnalytics,
    paymentAnalytics,
    guestAnalytics,
  } = data;

  const activeRatingInfo = modalRatingBreakdown || reviewAnalytics;
  const activeChartData = chartTimeframe === "monthly" ? revenueChart : dailyBookings;
  const activePaymentData = activePaymentView === "methods"
    ? paymentAnalytics?.paymentMethods
    : paymentAnalytics?.paymentStatus;

  const formattedReviewTrend = activeRatingInfo?.trend?.map((item) => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return {
      month: item._id?.month && item._id?.year ? `${monthNames[item._id.month - 1]} ${item._id.year}` : "N/A",
      rating: item.avgRating ? parseFloat(item.avgRating.toFixed(1)) : 0,
      count: item.count || 0,
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-blue-600" size={32} />
              Owner Insights
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Property:{" "}
              <span className="text-blue-600 font-bold">
                {overview?.hotel.name}
              </span>{" "}
              • {overview?.hotel.city}
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg">
            <Download size={18} /> Generate PDF Report
          </button>
        </div>

        {/* 1. TOP KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            label="Total Revenue"
            value={`₹${overview?.revenue.total.toLocaleString()}`}
            sub={`₹${overview?.revenue.pending.toLocaleString()} pending`}
            icon={<IndianRupee />}
            color="blue"
          />
          <KPICard
            label="Occupancy"
            value={overview?.rooms.occupancyRate}
            sub={`${overview?.rooms.occupied} / ${overview?.rooms.total} rooms`}
            icon={<BedDouble />}
            color="emerald"
          />
          <KPICard
            label="Booking Growth"
            value={overview?.bookings.growth}
            sub={`${overview?.bookings.thisMonth} new this month`}
            icon={<TrendingUp />}
            color="orange"
          />
          <KPICard
            label="Avg. Rating"
            value={`${reviewAnalytics?.avgRating} / 5`}
            sub={`${reviewAnalytics?.totalReviews} verified reviews`}
            icon={<Star />}
            color="amber"
          />
        </div>

        {/* 1.5 DETAILED BREAKDOWN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Booking Lifecycle */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" /> Booking Lifecycle
            </h3>
            <div className="space-y-5">
              <StatRow
                label="Total Reservations"
                value={overview?.bookings.total}
                color="text-slate-900"
              />
              <StatRow
                label="Completed Stays"
                value={overview?.bookings.completed}
                color="text-emerald-500"
                icon={<CheckCircle2 size={14} />}
              />
              <StatRow
                label="Active Guests"
                value={overview?.bookings.active}
                color="text-blue-500"
                icon={<Clock size={14} />}
              />
              <StatRow
                label="Canceled Bookings"
                value={overview?.bookings.canceled}
                color="text-rose-500"
                icon={<XCircle size={14} />}
              />

              <div className="pt-5 mt-5 border-t border-slate-50 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Volume this Month
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {overview?.bookings.thisMonth}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Last Month
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {overview?.bookings.lastMonth}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <IndianRupee size={16} className="text-emerald-600" /> Financial
              Health
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                  Lifetime Gross Revenue
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  ₹{(overview?.revenue.total || 0).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Confirmed
                  </p>
                  <p className="text-lg font-black text-blue-600">
                    ₹{overview?.revenue.thisMonth.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Pending
                  </p>
                  <p className="text-lg font-black text-orange-500">
                    ₹{overview?.revenue.pending.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Health */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BedDouble size={16} className="text-orange-600" /> Inventory
              Health
            </h3>
            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-[10px] border-slate-50">
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900">
                    {overview?.rooms.occupancyRate}
                  </p>
                  <p className="text-[8px] font-black text-slate-400 uppercase">
                    Occupied
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-6">
              <MiniBox label="Total" value={overview?.rooms.total} />
              <MiniBox
                label="Booked"
                value={overview?.rooms.occupied}
                color="text-blue-600"
              />
              <MiniBox
                label="Ready"
                value={overview?.rooms.available}
                color="text-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 2. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {chartTimeframe === "monthly" ? "Financial Growth (12 Months)" : "Daily Booking Trend (30 Days)"}
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setChartTimeframe("monthly")}
                  className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${
                    chartTimeframe === "monthly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setChartTimeframe("daily")}
                  className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${
                    chartTimeframe === "daily"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Daily (30D)
                </button>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey={chartTimeframe === "monthly" ? "month" : "date"}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    tickFormatter={(tick) => {
                      if (chartTimeframe === "daily") {
                        try {
                          return new Date(tick).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          });
                        } catch {
                          return tick;
                        }
                      }
                      return tick;
                    }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    name="Revenue (₹)"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    name="Bookings"
                    dataKey="bookings"
                    stroke="#10B981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorBook)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Distribution Pie */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight">
              Status Distribution
            </h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingDistribution}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {bookingDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. PERFORMANCE & PAYMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">
              Room Inventory Performance
            </h3>
            <div className="space-y-4">
              {roomPerformance.map((room) => (
                <div
                  key={room.roomId}
                  className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900">
                        {room.title}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {room.roomType}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900">
                        ₹{room.revenue.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase">
                        {room.occupancyRate} occupancy
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <MiniStat
                      label="Price / Day"
                      value={`₹${room.pricePerDay}`}
                    />
                    <MiniStat label="Total Rooms" value={room.totalRooms} />
                    <MiniStat label="Bookings" value={room.totalBookings} />
                    <MiniStat
                      label="Revenue / Room"
                      value={`₹${room.revenuePerRoom}`}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < Math.round(room.avgRating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {room.avgRating} ({room.totalReviews})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {activePaymentView === "methods" ? "Payment Methods" : "Payment Status Distribution"}
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setActivePaymentView("methods")}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                    activePaymentView === "methods"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Methods
                </button>
                <button
                  onClick={() => setActivePaymentView("status")}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                    activePaymentView === "status"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Status
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activePaymentData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{ borderRadius: "12px", border: "none" }}
                  />
                  <Bar
                    dataKey={activePaymentView === "methods" ? "revenue" : "amount"}
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  >
                    {activePaymentData?.map((entry, index) => {
                      let color = "#3B82F6"; // default blue
                      if (activePaymentView === "status") {
                        if (entry._id === "success") color = "#10B981"; // emerald
                        else if (entry._id === "pending" || entry._id === "processing") color = "#F59E0B"; // amber
                        else if (entry._id === "canceled" || entry._id === "failed") color = "#EF4444"; // rose
                      }
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. GUESTS & REVIEWS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Value Guests Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <Users size={20} className="text-indigo-600" /> Top Value Guests
              </h3>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                Live Data
              </span>
            </div>

            {/* Mini Stats Bar */}
            <div className="grid grid-cols-3 gap-2 mb-8 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-400 font-bold">
                  Total
                </p>
                <p className="text-sm font-black text-slate-800">
                  {guestAnalytics?.totalGuests || 0}
                </p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[10px] uppercase text-slate-400 font-bold">
                  Repeats
                </p>
                <p className="text-sm font-black text-slate-800">
                  {guestAnalytics?.repeatGuests || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-400 font-bold">
                  Rate
                </p>
                <p className="text-sm font-black text-emerald-600">
                  {guestAnalytics?.repeatRate
                    ? `${guestAnalytics.repeatRate}`
                    : "0%"}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {guestAnalytics?.topGuests.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md group-hover:scale-110 transition-transform">
                        {g.name.charAt(0)}
                      </div>
                      {i === 0 && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]">
                          👑
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {g.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {g.bookings} Stays Completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">
                      ₹{g.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Feedback Card */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Recent Guest Feedback
              </h3>
              <button
                onClick={() => {
                  setReviewsPage(1);
                  setShowReviewsModal(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View All Reviews
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewAnalytics?.recentReviews?.length > 0 ? (
                reviewAnalytics.recentReviews.map((r) => (
                  <div
                    key={r._id}
                    className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Quote size={40} className="text-slate-900" />
                    </div>

                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < r.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6 relative z-10">
                      "
                      {r.message ||
                        "The guest didn't leave a written comment, but gave a high rating."}
                      "
                    </p>

                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase border border-indigo-100">
                        {r.userId?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          {r.userId?.name || "Guest"}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          Verified Stay
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                    <Quote size={28} className="text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    No reviews yet
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Guests haven’t left feedback for this property yet. Once
                    they do, it’ll appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
      {/* REVIEWS DRAWER MODAL */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowReviewsModal(false)}
          ></div>

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Guest Feedback Ledger
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Property: {overview?.hotel?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Rating Summary Card */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-6 items-center">
                  <div className="text-center">
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">
                      {activeRatingInfo?.avgRating || "0.0"}
                    </p>
                    <div className="flex justify-center gap-0.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < Math.round(activeRatingInfo?.avgRating || 0)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                      {activeRatingInfo?.totalReviews || 0} reviews
                    </p>
                  </div>

                  {/* Progress Bars */}
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const ratingInfo = activeRatingInfo?.breakdown?.[rating] || { percentage: 0 };
                      const pct = parseFloat(ratingInfo.percentage) || 0;
                      return (
                        <div key={rating} className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-slate-600 min-w-[20px] text-right">
                            {rating}★
                          </span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-400 min-w-[30px]">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Trend Chart */}
                {formattedReviewTrend.length > 0 && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      Rating Trend (Last 6 Months)
                    </h4>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedReviewTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94A3B8", fontSize: 10 }}
                          />
                          <YAxis
                            domain={[1, 5]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94A3B8", fontSize: 10 }}
                            ticks={[1, 2, 3, 4, 5]}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              fontSize: "11px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="rating"
                            name="Average Rating"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ fill: "#F59E0B", strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Loading reviews...
                      </p>
                    </div>
                  ) : reviewsData.length > 0 ? (
                    reviewsData.map((r) => (
                      <div
                        key={r._id}
                        className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Quote size={30} className="text-slate-900" />
                        </div>

                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                              {r.userId?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {r.userId?.name || "Guest"}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {r.roomId?.roomType || "Standard Room"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex gap-0.5 justify-end">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={
                                    i < r.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200"
                                  }
                                />
                              ))}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">
                              {new Date(r.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-600 text-xs leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-50">
                          "{r.message || 'No written review comment provided.'}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-slate-400">
                      <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-bold">No feedback available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Pagination */}
              {reviewsPagination && reviewsPagination.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                  <button
                    disabled={!reviewsPagination.hasPrevPage}
                    onClick={() => setReviewsPage((prev) => prev - 1)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                      reviewsPagination.hasPrevPage
                        ? "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                        : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                    }`}
                  >
                    ← Prev
                  </button>

                  <span className="text-xs font-bold text-slate-500">
                    Page {reviewsPagination.currentPage} of {reviewsPagination.totalPages}
                  </span>

                  <button
                    disabled={!reviewsPagination.hasNextPage}
                    onClick={() => setReviewsPage((prev) => prev + 1)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                      reviewsPagination.hasNextPage
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                        : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  </div>
  );
};

// --- HELPER UI COMPONENTS (Defined outside to avoidvite import errors) ---
const MiniStat = ({ label, value }) => (
  <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
    <p className="text-[9px] font-black text-slate-400 uppercase">{label}</p>
    <p className="text-sm font-black text-slate-800">{value}</p>
  </div>
);

const StatRow = ({ label, value, color, icon }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
      {icon && <span className={color}>{icon}</span>}
      <span className="text-sm font-bold text-slate-500">{label}</span>
    </div>
    <span className={`text-base font-black ${color}`}>{value || 0}</span>
  </div>
);

const MiniBox = ({ label, value, color = "text-slate-700" }) => (
  <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 transition-colors">
    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
      {label}
    </p>
    <p className={`text-sm font-black ${color}`}>{value || 0}</p>
  </div>
);

const KPICard = ({ label, value, sub, icon, color }) => {
  const bgColors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
      <div
        className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${bgColors[color]}`}
      >
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">
          {value}
        </p>
        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter italic">
          {sub}
        </p>
      </div>
    </div>
  );
};

export default OwnerDashboard;
