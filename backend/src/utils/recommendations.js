export const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const lastBooking = await Booking.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("hotelId");


    if (!lastBooking) {
      const popularHotels = await Hotel.find()
        .sort({ rating: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        recommendations: popularHotels
      });
    }


    const city = lastBooking.hotelId.city;
    const price = lastBooking.totalPrice;

    const recommendations = await Hotel.find({
      city,
      basePrice: {
        $gte: price - 1000,
        $lte: price + 1000
      }
    }).limit(5);

    return res.status(200).json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error("Recommendation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
