import React from "react";
import { Star } from "lucide-react";

const HotelReviews = ({ reviews, hotelData }) => {
  return (
    <section
      id="reviews"
      className="scroll-mt-28 mt-16 pt-10 border-t border-gray-100"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Guest Reviews
          </h2>
          <p className="text-sm text-gray-500">
            What travelers say about {hotelData.name}
          </p>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {hotelData.avgRating}
            </p>
            <div className="flex gap-0.5 text-amber-400 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {hotelData.totalReviews} reviews
            </p>
          </div>
          <div className="w-px h-12 bg-gray-100" />
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 w-32">
                <span className="text-[10px] text-gray-400 w-2">{star}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: star === 5 ? "80%" : star === 4 ? "15%" : "5%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                {review.userId?.name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {review.userId?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {review.userId?.location || "Verified Traveler"}
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              "{review.message}"
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
              </div>
              <span className="text-[11px] text-gray-400">Jan 2026</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HotelReviews;
