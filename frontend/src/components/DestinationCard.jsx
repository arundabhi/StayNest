const DestinationCard = ({ image, city, hotelCount, rating }) => {
  return (
    <div className="group cursor-pointer overflow-hidden rounded-2xl shadow hover:shadow-lg transition">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={image}
          alt={city}
          className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
        />

        {rating && (
          <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-sm font-semibold">
            ⭐ {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{city}</h3>
        <p className="text-sm text-gray-500">{hotelCount}+ Hotels</p>
      </div>
    </div>
  );
};

export default DestinationCard;
