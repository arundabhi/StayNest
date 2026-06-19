import React from "react";
import { Hotel, Clock, Users } from "lucide-react";
import StatCard from "./StatCard";
import HotelTable from "./HotelTable";

const OverviewTab = ({ stats, hotelsList, onRefresh }) => (
  <>
    <header className="mb-8">
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
        System Overview
      </h1>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <StatCard
        title="Total Hotels"
        value={stats.hotels}
        icon={<Hotel className="text-blue-600" />}
        color="bg-blue-50"
      />
      <StatCard
        title="Pending Review"
        value={stats.pending}
        icon={<Clock className="text-orange-600" />}
        color="bg-orange-50"
      />
      <StatCard
        title="Total Owners"
        value={stats.owners}
        icon={<Users className="text-purple-600" />}
        color="bg-purple-50"
      />
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 font-bold text-slate-800">
        Recently Added Hotels
      </div>
      <HotelTable hotels={hotelsList.slice(0, 5)} onRefresh={onRefresh} />
    </div>
  </>
);

export default OverviewTab;
