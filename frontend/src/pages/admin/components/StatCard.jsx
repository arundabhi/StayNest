import React from "react";

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 group">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {title}
      </p>
      <p className="text-4xl font-black text-slate-900 mt-2">{value}</p>
    </div>
    <div
      className={`p-4 rounded-2xl transition-colors duration-300 ${color} group-hover:scale-110`}
    >
      {icon}
    </div>
  </div>
);

export default StatCard;
