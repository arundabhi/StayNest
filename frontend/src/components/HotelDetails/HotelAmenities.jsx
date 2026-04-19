import React from "react";
import {
  Wifi,
  Wind,
  Tv,
  Utensils,
  Coffee,
  Car,
  Waves,
  Dumbbell,
  Globe,
} from "lucide-react";

const amenityIcons = {
  wifi: <Wifi size={18} />,
  ac: <Wind size={18} />,
  "air conditioning": <Wind size={18} />,
  tv: <Tv size={18} />,
  breakfast: <Utensils size={18} />,
  coffee: <Coffee size={18} />,
  parking: <Car size={18} />,
  pool: <Waves size={18} />,
  gym: <Dumbbell size={18} />,
  default: <Globe size={18} />,
};

const HotelAmenities = ({ hotelData }) => {
  return (
    <section
      id="amenities"
      className="scroll-mt-28 pt-6 border-t border-gray-100"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Amenities</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {hotelData.amenities?.map((amenity, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
          >
            <span className="text-indigo-500">
              {amenityIcons[amenity.toLowerCase()] || amenityIcons.default}
            </span>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {amenity}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HotelAmenities;
