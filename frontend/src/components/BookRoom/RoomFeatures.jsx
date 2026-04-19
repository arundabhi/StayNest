import React from "react";
import { Wifi, AirVent, Coffee, Tv, Languages, Wind, Info } from "lucide-react";

const AmenityItem = ({ icon, label, active }) => (
  <div
    className={`flex items-center gap-3 ${
      active ? "text-gray-700" : "text-gray-300 line-through"
    }`}
  >
    <div
      className={`p-2 rounded-lg ${
        active ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-300"
      }`}
    >
      {icon}
    </div>
    <span className="text-xs font-bold">{label}</span>
  </div>
);

const RoomFeatures = ({ data }) => {
  return (
    <section className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Room Features & Amenities
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <AmenityItem
          icon={<Wifi size={18} />}
          label="High Speed WiFi"
          active={data.room?.amenities?.includes("wifi") || true}
        />
        <AmenityItem
          icon={<AirVent size={18} />}
          label="Air Conditioning"
          active={true}
        />
        <AmenityItem
          icon={<Coffee size={18} />}
          label="Breakfast Included"
          active={data.room?.amenities?.includes("breakfast") || true}
        />
        <AmenityItem icon={<Tv size={18} />} label="Smart TV" active={true} />
        <AmenityItem
          icon={<Languages size={18} />}
          label="Room Service"
          active={true}
        />
        <AmenityItem
          icon={<Wind size={18} />}
          label="Balcony View"
          active={data.room?.type?.toLowerCase().includes("luxury")}
        />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex gap-3 items-start">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">Room Information</p>
          <p className="text-xs text-blue-700 leading-relaxed mt-1">
            {data.room?.description ||
              "This spacious room offers premium bedding, a work desk, and integrated climate control for a comfortable stay."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default RoomFeatures;
