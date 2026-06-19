import { useEffect, useState } from "react";
import api from "../../api/axios.config";
import {
  LayoutDashboard,
  Hotel,
  Users,
  Clock,
  LogOut,
  Loader2,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import OverviewTab from "./components/OverviewTab";
import PendingTab from "./components/PendingTab";
import HotelsTab from "./components/HotelsTab";
import OwnersTab from "./components/OwnersTab";
import CouponsTab from "./components/CouponsTab";

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState("overview");
  const [stats, setStats] = useState({ hotels: 0, pending: 0, owners: 0 });
  const [hotelsList, setHotelsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, pendingRes, ownersRes] = await Promise.all([
        api.get("/admin/hotels"),
        api.get("/admin/register-hotels"),
        api.get("/admin/get-all-owner"),
      ]);

      setStats({
        hotels: hotelsRes.data.hotels?.length || 0,
        pending: pendingRes.data.hotels?.length || 0,
        owners: ownersRes.data.count || 0,
      });
      setHotelsList(hotelsRes.data.hotels || []);
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard data");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full shadow-2xl z-10">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-blue-500" />
          <span
            className={`text-3xl font-black tracking-tighter text-white cursor-pointer`}
          >
            STAY<span className="text-blue-600">NEXT</span>
            <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-lg align-middle tracking-widest uppercase">
              Admin
            </span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            onClick={() => setCurrentView("overview")}
            className="w-full text-left"
          >
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Overview"
              active={currentView === "overview"}
            />
          </button>
          <button
            onClick={() => setCurrentView("hotels")}
            className="w-full text-left"
          >
            <NavItem
              icon={<Hotel size={20} />}
              label="Manage Hotels"
              active={currentView === "hotels"}
            />
          </button>
          <button
            onClick={() => setCurrentView("owners")}
            className="w-full text-left"
          >
            <NavItem
              icon={<Users size={20} />}
              label="Owners"
              active={currentView === "owners"}
            />
          </button>
          <button
            onClick={() => setCurrentView("pending")}
            className="w-full text-left"
          >
            <NavItem
              icon={<Clock size={20} />}
              label="Pending Requests"
              active={currentView === "pending"}
            />
          </button>
          <button
            onClick={() => setCurrentView("coupons")}
            className="w-full text-left"
          >
            <NavItem
              icon={<Ticket size={20} />}
              label="Manage Coupons"
              active={currentView === "coupons"}
            />
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition w-full px-4 py-2"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-8">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">
              Synchronizing System...
            </p>
          </div>
        ) : (
          <>
            {currentView === "overview" && (
              <OverviewTab
                stats={stats}
                hotelsList={hotelsList}
                onRefresh={fetchData}
              />
            )}
            {currentView === "hotels" && (
              <HotelsTab hotelsList={hotelsList} onRefresh={fetchData} />
            )}
            {currentView === "pending" && (
              <PendingTab refreshData={fetchData} />
            )}
            {currentView === "owners" && <OwnersTab hotelsList={hotelsList} />}
            {currentView === "coupons" && <CouponsTab />}
          </>
        )}
      </main>
    </div>
  );
};

// UI Components
const NavItem = ({ icon, label, active = false }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}
  >
    {icon} <span className="font-bold text-sm tracking-wide">{label}</span>
  </div>
);

export default AdminDashboard;
