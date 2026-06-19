import React, { useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import RoomWishlistToggle from "../RoomWishlistToggle";
import { useHotel } from "../../context/HotelContext";
import RoomAvailabilityModal from "./RoomAvailabilityModal";

const HotelSuites = ({ handleBookingRedirect }) => {
  const {
    filteredSuites,
    festivalPricing,
    selectedRoomType,
    setSelectedRoomType,
    handleDateChange,
  } = useHotel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleOpenCalendar = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <section id="suites" className="scroll-mt-28 pt-6 border-t border-gray-100">

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
        <div className="flex gap-2 flex-wrap">
          {["All", "deluxe", "double", "suite"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedRoomType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition border ${selectedRoomType === type
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredSuites.map((room) => {
          const discountedPrice = festivalPricing
            ? Math.round(room.pricePerDay * festivalPricing.multiplier)
            : room.pricePerDay;
          return (
            <div
              key={room._id}
              className="flex flex-col sm:flex-row bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="sm:w-52 h-44 sm:h-auto relative shrink-0 overflow-hidden">
                <img
                  src={room.images?.[0]}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  alt={room.title}
                />
                <div className="absolute top-3 left-3">
                  <RoomWishlistToggle roomId={room._id} />
                </div>
                <span className="absolute bottom-3 left-3 bg-black/50 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize">
                  {room.roomType}
                </span>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {room.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
                    {room.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities?.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-100 capitalize"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between pt-4 border-t border-gray-50">
                  <div>
                    {festivalPricing ? (
                      <>
                        <p className="text-sm text-gray-400 line-through">
                          ₹{room.pricePerDay.toLocaleString()}
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{discountedPrice.toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{room.pricePerDay.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">per night</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCalendar(room)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
                    >
                      <Calendar size={15} className="text-indigo-500" /> Availability
                    </button>
                    <button
                      onClick={() => handleBookingRedirect(room._id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition active:scale-95"
                    >
                      Book Now <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && selectedRoom && (
        <RoomAvailabilityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          roomId={selectedRoom._id}
          roomTitle={selectedRoom.title}
          pricePerDay={festivalPricing ? Math.round(selectedRoom.pricePerDay * festivalPricing.multiplier) : selectedRoom.pricePerDay}
          handleBookingRedirect={handleBookingRedirect}
          handleDateChange={handleDateChange}
        />
      )}
    </section>
  );
};
export default HotelSuites;
