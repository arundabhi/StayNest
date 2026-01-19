import React, { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from "recharts";
import { 
  TrendingUp, Users, Calendar, IndianRupee, Star, 
  LayoutDashboard, Download, Wallet, BedDouble, 
  MessageSquare, CheckCircle2, XCircle, Clock, ChevronRight
} from "lucide-react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";
import {  useNavigate } from "react-router-dom";

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
const navigate = useNavigate()
  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [ov, rev, dist, daily, room, review, pay, guest] = await Promise.all([
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
      navigate('/')
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-xs">Generating Insights...</p>
      </div>
    </div>
  );

  const { overview, revenueChart, bookingDistribution, roomPerformance, reviewAnalytics, paymentAnalytics, guestAnalytics } = data;

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
            <p className="text-slate-500 font-medium mt-1">Property: <span className="text-blue-600 font-bold">{overview?.hotel.name}</span> • {overview?.hotel.city}</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg">
            <Download size={18} /> Generate PDF Report
          </button>
        </div>

        {/* 1. TOP KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard label="Total Revenue" value={`₹${overview?.revenue.total.toLocaleString()}`} sub={`₹${overview?.revenue.pending.toLocaleString()} pending`} icon={<IndianRupee />} color="blue" />
          <KPICard label="Occupancy" value={overview?.rooms.occupancyRate} sub={`${overview?.rooms.occupied} / ${overview?.rooms.total} rooms`} icon={<BedDouble />} color="emerald" />
          <KPICard label="Booking Growth" value={overview?.bookings.growth} sub={`${overview?.bookings.thisMonth} new this month`} icon={<TrendingUp />} color="orange" />
          <KPICard label="Avg. Rating" value={`${reviewAnalytics?.avgRating} / 5`} sub={`${reviewAnalytics?.totalReviews} verified reviews`} icon={<Star />} color="amber" />
        </div>

        {/* 1.5 DETAILED BREAKDOWN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Booking Lifecycle */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Calendar size={16} className="text-blue-600" /> Booking Lifecycle
            </h3>
            <div className="space-y-5">
              <StatRow label="Total Reservations" value={overview?.bookings.total} color="text-slate-900" />
              <StatRow label="Completed Stays" value={overview?.bookings.completed} color="text-emerald-500" icon={<CheckCircle2 size={14}/>} />
              <StatRow label="Active Guests" value={overview?.bookings.active} color="text-blue-500" icon={<Clock size={14}/>} />
              <StatRow label="Canceled Bookings" value={overview?.bookings.canceled} color="text-rose-500" icon={<XCircle size={14}/>} />
              
              <div className="pt-5 mt-5 border-t border-slate-50 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Volume this Month</p>
                  <p className="text-xl font-black text-slate-900">{overview?.bookings.thisMonth}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Last Month</p>
                    <p className="text-sm font-bold text-slate-700">{overview?.bookings.lastMonth}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <IndianRupee size={16} className="text-emerald-600" /> Financial Health
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lifetime Gross Revenue</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{(overview?.revenue.total || 0).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Confirmed</p>
                  <p className="text-lg font-black text-blue-600">₹{overview?.revenue.thisMonth.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pending</p>
                  <p className="text-lg font-black text-orange-500">₹{overview?.revenue.pending.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Health */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <BedDouble size={16} className="text-orange-600" /> Inventory Health
            </h3>
            <div className="flex items-center justify-center py-2">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-[10px] border-slate-50">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-900">{overview?.rooms.occupancyRate}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Occupied</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-6">
                <MiniBox label="Total" value={overview?.rooms.total} />
                <MiniBox label="Booked" value={overview?.rooms.occupied} color="text-blue-600" />
                <MiniBox label="Ready" value={overview?.rooms.available} color="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* 2. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight">Financial Growth (12 Months)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Distribution Pie */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-8 tracking-tight">Status Distribution</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingDistribution} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="count" nameKey="status">
                    {bookingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Room Inventory Performance</h3>
            <div className="space-y-4">
              {roomPerformance.map((room) => (
  <div
    key={room.roomId}
    className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-black text-slate-900">{room.title}</h4>
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
      <MiniStat label="Price / Day" value={`₹${room.pricePerDay}`} />
      <MiniStat label="Total Rooms" value={room.totalRooms} />
      <MiniStat label="Bookings" value={room.totalBookings} />
      <MiniStat label="Revenue / Room" value={`₹${room.revenuePerRoom}`} />
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
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Payment Methods</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentAnalytics?.paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. GUESTS & REVIEWS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
              <Users size={20} className="text-blue-600" /> Top Value Guests
            </h3>
            <div className="space-y-4">
              {guestAnalytics?.topGuests.map((g, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm uppercase">
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{g.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{g.bookings} Stays</p>
                    </div>
                  </div>
                  <p className="font-black text-slate-700 text-sm">₹{g.totalSpent.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Recent Guest Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewAnalytics?.recentReviews.map((r) => (
                <div key={r._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs italic line-clamp-3 mb-4">"{r.message || "No comment provided"}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-black uppercase">
                      {r.userId?.name?.charAt(0)}
                    </div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{r.userId?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{label}</p>
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
      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${bgColors[color]}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter italic">{sub}</p>
      </div>
    </div>
  );
};

export default OwnerDashboard;