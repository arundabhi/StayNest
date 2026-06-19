import React from "react";
import HotelTable from "./HotelTable";

const HotelsTab = ({ hotelsList, onRefresh }) => (
  <div>
    <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">
      Manage Inventory
    </h1>
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <HotelTable hotels={hotelsList} onRefresh={onRefresh} />
    </div>
  </div>
);

export default HotelsTab;
