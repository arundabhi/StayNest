import React, { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, Calendar, 
  IndianRupee, Star, LayoutDashboard, Download, Filter,
  BedDouble, Crown, ArrowUpRight
} from "lucide-react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [roomPerformance, setRoomPerformance] = useState([]);
  const [guestAnalytics, setGuestAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [overview, revenue, rooms, guests] = await Promise.all([
          api.get(`${import.meta.env.VITE_API_URL}/analytics/dashboard/overview`),
          api.get(`${import.meta.env.VITE_API_URL}/analytics/revenue/chart`),
          api.get(`${import.meta.env.VITE_API_URL}/analytics/rooms/performance`),
          api.get(`${import.meta.env.VITE_API_URL}/analytics/guests`)
        ]);
        
        setData(overview.data.overview);
        setRevenueTrend(revenue.data.chartData);
        setRoomPerformance(rooms.data.rooms);
        setGuestAnalytics(guests.data.analytics);
      } catch (err) {
        toast.error("Analytics sync failed. Check server connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold animate-pulse">GENERATING INSIGHTS...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFDFF] pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-blue-600" size={32} />
              Hotel Command Center
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Performance metrics for <span className="text-slate-900 font-bold">{data.hotel.name}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:shadow-md transition-all">
              <Download size={18} /> Reports
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
              <Filter size={18} /> Monthly
            </button>
          </div>
        </div>

        {/* TOP KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard label="Total Revenue" value={`₹${data.revenue.total.toLocaleString()}`} trend={data.bookings.growth} isUp={parseFloat(data.bookings.growth) > 0} icon={<IndianRupee />} color="blue" />
          <KPICard label="Occupancy" value={data.rooms.occupancyRate} trend="+2.4%" isUp={true} icon={<Calendar />} color="emerald" />
          <KPICard label="Repeat Guests" value={guestAnalytics?.repeatRate || "0%"} trend={`${guestAnalytics?.repeatGuests} Users`} isUp={true} icon={<Users />} color="indigo" />
          <KPICard label="Avg Rating" value={data.reviews.average} trend={`${data.reviews.total} Reviews`} isUp={true} icon={<Star />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* REVENUE AREA CHART */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Financial Growth</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GUEST ANALYTICS SIDEBAR */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
                <Crown className="text-amber-500" size={20} /> Top Guests
            </h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {guestAnalytics?.topGuests.map((guest, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-blue-600 shadow-sm border border-slate-100">
                            {guest.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{guest.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{guest.bookings} Stays</p>
                        </div>
                    </div>
                    <p className="text-sm font-black text-slate-700">₹{guest.totalSpent.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Lifetime Value Focus</p>
                <div className="flex justify-between items-center text-sm font-bold text-slate-600 px-2">
                    <span>Total Customers</span>
                    <span className="text-slate-900">{guestAnalytics?.totalGuests}</span>
                </div>
            </div>
          </div>
        </div>

        {/* ROOM PERFORMANCE TABLE */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Room Inventory Analytics</h3>
            <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                Real-time Occupancy
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room Type</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bookings</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Occupancy</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {roomPerformance.map((room) => (
                  <tr key={room.roomId} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                <BedDouble size={16} className="text-slate-500" />
                            </div>
                            <span className="font-bold text-slate-700">{room.title}</span>
                        </div>
                    </td>
                    <td className="py-5 text-sm font-bold text-slate-500 capitalize">{room.roomType}</td>
                    <td className="py-5 text-sm font-bold text-slate-700">{room.totalBookings}</td>
                    <td className="py-5">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-black text-blue-600">{room.occupancyRate}</span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: room.occupancyRate }}></div>
                            </div>
                        </div>
                    </td>
                    <td className="py-5 text-right font-black text-slate-900">₹{room.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Helper Components ---
const KPICard = ({ label, value, trend, isUp, icon, color }) => {
  const bgColors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${bgColors[color]}`}>
          {React.cloneElement(icon, { size: 22 })}
        </div>
        <div className={`flex items-center gap-1 text-xs font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;