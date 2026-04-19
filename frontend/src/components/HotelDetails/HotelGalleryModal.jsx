import React, { useEffect } from "react";
import { ChevronLeft, X } from "lucide-react";

const HotelGalleryModal = ({ hotelData, showAllPhotos, setShowAllPhotos }) => {
  useEffect(() => {
    if (showAllPhotos) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showAllPhotos]);

  if (!showAllPhotos) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-white overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button
          onClick={() => setShowAllPhotos(false)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition"
        >
          <ChevronLeft size={20} /> Back to hotel
        </button>
        <p className="text-sm text-gray-500">
          {hotelData.images?.length} photos
        </p>
        <button
          onClick={() => setShowAllPhotos(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto h-full p-4 sm:p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {hotelData.name}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {hotelData.city}, {hotelData.state}
          </p>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {hotelData.images?.map((img, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden cursor-zoom-in"
              >
                <img
                  src={img}
                  className="w-full object-cover hover:scale-105 transition-transform duration-500"
                  alt={`Photo ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelGalleryModal;
