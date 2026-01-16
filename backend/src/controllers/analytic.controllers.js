
import { Booking } from "../models/booking.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Room } from "../models/room.models.js";
import { Review } from "../models/review.models.js";
import { Payment } from "../models/payment.models.js";
import mongoose from "mongoose";


export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.userId;

   
    const hotel = await Hotel.findOne({ owner: userId });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const hotelId = hotel._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalBookings,
      activeBookings,
      completedBookings,
      canceledBookings,
      thisMonthBookings,
      lastMonthBookings,
      totalRevenue,
      thisMonthRevenue,
      pendingPayments,
      totalRooms,
      occupiedRooms,
      avgRating,
      totalReviews,
    ] = await Promise.all([
      
      Booking.countDocuments({ hotelId }),

     
      Booking.countDocuments({
        hotelId,
        status: "booked",
        checkIn: { $lte: today },
        checkOut: { $gte: today },
      }),

     
      Booking.countDocuments({ hotelId, status: "completed" }),

      Booking.countDocuments({ hotelId, status: "canceled" }),

      Booking.countDocuments({
        hotelId,
        createdAt: { $gte: thisMonthStart },
      }),

      Booking.countDocuments({
        hotelId,
        createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd },
      }),

      Booking.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotelId),
            paymentStatus: "confirm",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

     
      Booking.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotelId),
            paymentStatus: "confirm",
            createdAt: { $gte: thisMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

   
      Booking.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotelId),
            paymentStatus: "pending",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

  
      Room.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
        { $group: { _id: null, total: { $sum: "$totalRooms" } } },
      ]),

      Booking.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotelId),
            status: "booked",
            checkIn: { $lte: today },
            checkOut: { $gte: today },
          },
        },
        { $count: "occupied" },
      ]),

     
      Review.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),

    
      Review.countDocuments({ hotelId }),
    ]);

  
    const bookingGrowth =
      lastMonthBookings > 0
        ? (((thisMonthBookings - lastMonthBookings) / lastMonthBookings) *
            100
          ).toFixed(1)
        : 0;

    const occupancyRate = totalRooms[0]?.total
      ? ((occupiedRooms[0]?.occupied || 0) / totalRooms[0].total) * 100
      : 0;

    return res.status(200).json({
      success: true,
      message: "Dashboard overview fetched",
      overview: {
        hotel: {
          name: hotel.name,
          city: hotel.city,
          avgRating: hotel.avgRating,
          totalReviews: hotel.totalReviews,
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          completed: completedBookings,
          canceled: canceledBookings,
          thisMonth: thisMonthBookings,
          lastMonth: lastMonthBookings,
          growth: `${bookingGrowth}%`,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: thisMonthRevenue[0]?.total || 0,
          pending: pendingPayments[0]?.total || 0,
        },
        rooms: {
          total: totalRooms[0]?.total || 0,
          occupied: occupiedRooms[0]?.occupied || 0,
          available: (totalRooms[0]?.total || 0) - (occupiedRooms[0]?.occupied || 0),
          occupancyRate: `${occupancyRate.toFixed(1)}%`,
        },
        reviews: {
          average: avgRating[0]?.avg?.toFixed(1) || 0,
          total: totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 📈 2. Revenue Chart Data (Monthly for last 12 months)
export const getRevenueChart = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const hotelId = hotel._id;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const revenueData = await Booking.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotelId),
          paymentStatus: "confirm",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
            ],
          },
          revenue: 1,
          bookings: 1,
        },
      },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const chartData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      const data = revenueData.find((d) => d.month === yearMonth);
      
      chartData.push({
        month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        revenue: data?.revenue || 0,
        bookings: data?.bookings || 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Revenue chart data fetched",
      chartData,
    });
  } catch (error) {
    console.error("Revenue chart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 📊 3. Booking Status Distribution (Pie Chart)
export const getBookingStatusDistribution = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const distribution = await Booking.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotel._id) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);

    const chartData = distribution.map((item) => ({
      status: item._id,
      count: item.count,
      percentage: ((item.count / total) * 100).toFixed(1),
      revenue: item.revenue,
    }));

    return res.status(200).json({
      success: true,
      message: "Booking distribution fetched",
      chartData,
      total,
    });
  } catch (error) {
    console.error("Booking distribution error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🏨 4. Room Performance Analytics
export const getRoomPerformance = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const rooms = await Room.find({ hotelId: hotel._id });

    const roomStats = await Promise.all(
      rooms.map(async (room) => {
        const [totalBookings, revenue, avgRating, reviews] = await Promise.all([
          Booking.countDocuments({ roomId: room._id, status: "completed" }),
          
          Booking.aggregate([
            {
              $match: {
                roomId: new mongoose.Types.ObjectId(room._id),
                paymentStatus: "confirm",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } },
          ]),

          Review.aggregate([
            { $match: { roomId: new mongoose.Types.ObjectId(room._id) } },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ]),

          Review.countDocuments({ roomId: room._id }),
        ]);

        const occupancyRate = room.totalRooms > 0
          ? ((totalBookings / (room.totalRooms * 30)) * 100).toFixed(1)
          : 0;

        return {
          roomId: room._id,
          title: room.title,
          roomType: room.roomType,
          pricePerDay: room.pricePerDay,
          totalRooms: room.totalRooms,
          totalBookings,
          revenue: revenue[0]?.total || 0,
          avgRating: avgRating[0]?.avg?.toFixed(1) || 0,
          totalReviews: reviews,
          occupancyRate: `${occupancyRate}%`,
          revenuePerRoom: room.totalRooms > 0 
            ? Math.round((revenue[0]?.total || 0) / room.totalRooms)
            : 0,
        };
      })
    );

    roomStats.sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      message: "Room performance fetched",
      rooms: roomStats,
    });
  } catch (error) {
    console.error("Room performance error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 📅 5. Daily Bookings Trend (Last 30 Days)
export const getDailyBookingsTrend = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyData = await Booking.aggregate([
      {
        $match: {
          hotelId: new mongoose.Types.ObjectId(hotel._id),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          bookings: 1,
          revenue: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Daily bookings trend fetched",
      chartData: dailyData,
    });
  } catch (error) {
    console.error("Daily bookings trend error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ⭐ 6. Review Analytics
export const getReviewAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const [ratingDistribution, recentReviews, reviewTrend] = await Promise.all([
     
      Review.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotel._id) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),

      Review.find({ hotelId: hotel._id })
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .limit(5),

   
      Review.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotel._id),
            createdAt: {
              $gte: new Date(
                new Date().setMonth(new Date().getMonth() - 6)
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const totalReviews = ratingDistribution.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const breakdown = {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    };

    ratingDistribution.forEach((item) => {
      breakdown[item._id].count = item.count;
      breakdown[item._id].percentage = totalReviews
        ? ((item.count / totalReviews) * 100).toFixed(1)
        : 0;
    });

    return res.status(200).json({
      success: true,
      message: "Review analytics fetched",
      analytics: {
        avgRating: hotel.avgRating,
        totalReviews,
        breakdown,
        recentReviews,
        trend: reviewTrend,
      },
    });
  } catch (error) {
    console.error("Review analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 💰 7. Payment Analytics
export const getPaymentAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const [paymentMethods, paymentStatus, recentPayments] = await Promise.all([
 
      Booking.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotel._id) } },
        {
          $group: {
            _id: "$paymentMode",
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),


      Booking.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotel._id) } },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
            amount: { $sum: "$totalPrice" },
          },
        },
      ]),

    
      Payment.find({ 
        bookingId: { $in: await Booking.find({ hotelId: hotel._id }).distinct('_id') }
      })
        .populate({
          path: "bookingId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.status(200).json({
      success: true,
      message: "Payment analytics fetched",
      analytics: {
        paymentMethods,
        paymentStatus,
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Payment analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 👥 8. Guest Analytics
export const getGuestAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const [totalGuests, repeatGuests, topGuests] = await Promise.all([
    
      Booking.distinct("userId", { 
        hotelId: hotel._id,
        status: { $in: ["booked", "completed"] }
      }),

 
      Booking.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotel._id),
            status: { $in: ["booked", "completed"] },
          },
        },
        { $group: { _id: "$userId", bookings: { $sum: 1 } } },
        { $match: { bookings: { $gt: 1 } } },
        { $count: "repeat" },
      ]),


      Booking.aggregate([
        {
          $match: {
            hotelId: new mongoose.Types.ObjectId(hotel._id),
            paymentStatus: "confirm",
          },
        },
        {
          $group: {
            _id: "$userId",
            totalSpent: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            totalSpent: 1,
            bookings: 1,
          },
        },
      ]),
    ]);

    const repeatRate = totalGuests.length > 0
      ? (((repeatGuests[0]?.repeat || 0) / totalGuests.length) * 100).toFixed(1)
      : 0;

    return res.status(200).json({
      success: true,
      message: "Guest analytics fetched",
      analytics: {
        totalGuests: totalGuests.length,
        repeatGuests: repeatGuests[0]?.repeat || 0,
        repeatRate: `${repeatRate}%`,
        topGuests,
      },
    });
  } catch (error) {
    console.error("Guest analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};