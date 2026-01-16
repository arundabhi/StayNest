import React, { useEffect, useState } from "react";
import axios from "axios";
import CouponCard from "../components/CouponCard";
import { Ticket, Filter, Sparkles, Info } from "lucide-react";

const Coupons = () => {
  const token = localStorage.getItem("accessToken");

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/coupons/available?amount=0`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setCoupons(res.data.coupons);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [token]);

  // Filter logic for tabs
  const filteredCoupons = coupons.filter(coupon => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
    return activeTab === "active" ? !isExpired : isExpired;
  });

  /* --- Skeleton UI --- */
  const Skeleton = () => (
    <div className="bg-white rounded-3xl h-64 w-full animate-pulse border border-gray-100 p-6">
      <div className="flex justify-between mb-6">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-3 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="w-16 h-8 bg-gray-200 rounded-full" />
      </div>
      <div className="w-full h-20 bg-gray-50 rounded-2xl mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] border border-rose-100 max-w-md text-center">
          <Info className="mx-auto mb-4" size={40} />
          <h2 className="text-xl font-black mb-2 tracking-tight">Something went wrong</h2>
          <p className="text-sm opacity-80 mb-6 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HERO HEADER */}
        <header className="relative bg-blue-600 rounded-[2.5rem] p-10 md:p-16 overflow-hidden mb-12 shadow-2xl shadow-blue-200">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-50 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                <Sparkles size={14} /> Exclusive Rewards
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-4">
                Smart Savings,<br />Better Stays.
              </h1>
              <p className="text-blue-100 font-medium text-lg max-w-md opacity-90 leading-relaxed">
                Stack up your discounts and travel the world without breaking the bank.
              </p>
            </div>
            
            <div className="hidden lg:block relative group">
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Ticket size={120} className="text-white opacity-20" />
              </div>
            </div>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-20 -mb-20" />
        </header>

        {/* CONTROLS & TABS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab("active")}
              className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-black tracking-tight transition-all ${activeTab === "active" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Available
            </button>
            <button 
              onClick={() => setActiveTab("expired")}
              className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-black tracking-tight transition-all ${activeTab === "expired" ? "bg-white text-gray-400 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Past Deals
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <Filter size={16} />
            Showing {filteredCoupons.length} {activeTab} coupons
          </div>
        </div>

        {/* COUPON GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-4xl border-2 border-dashed border-gray-100">
            <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No coupons found for this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredCoupons.map((coupon) => (
              <CouponCard key={coupon._id} coupon={coupon} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Coupons;