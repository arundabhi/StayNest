import React from "react";
import { ShieldCheck, Award } from "lucide-react";

const HotelOverview = ({ hotelData }) => {
  return (
    <section id="overview" className="scroll-mt-28 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">About this property</h2>
      <p className="text-gray-600 leading-relaxed">{hotelData.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Verified Safety</p>
            <p className="text-sm text-gray-500">
              Health and security protocols verified for 2026.
            </p>
          </div>
        </div>
        <div className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Award size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">Award Winning</p>
            <p className="text-sm text-gray-500">
              Recognized for outstanding hospitality.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HotelOverview;
