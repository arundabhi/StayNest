import React from "react";

const HotelPhotoGrid = ({ hotelData, setShowAllPhotos }) => {
  return (
    <div className="mb-10 grid grid-cols-4 grid-rows-2 h-[360px] gap-2 rounded-2xl overflow-hidden relative">
      <div className="col-span-2 row-span-2 overflow-hidden">
        <img
          src={hotelData.images?.[0]}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          alt="Main"
        />
      </div>
      {hotelData.images?.slice(1, 5).map((img, i) => (
        <div key={i} className="hidden sm:block overflow-hidden">
          <img
            src={img}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            alt={`View ${i + 1}`}
          />
        </div>
      ))}
      <button
        onClick={() => setShowAllPhotos(true)}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-semibold text-gray-700 shadow-md hover:bg-white transition"
      >
        View all {hotelData.images?.length} photos
      </button>
    </div>
  );
};

export default HotelPhotoGrid;
