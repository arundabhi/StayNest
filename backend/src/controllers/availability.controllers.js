// availability.controllers.js
import { Booking } from "../models/booking.models.js";
import { Room } from "../models/room.models.js";
import { Hotel } from "../models/hotel.models.js";
import mongoose from "mongoose";

// 📅 1. Get Room Availability Calendar (Date Range)
export const getRoomAvailabilityCalendar = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }


    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);


    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }


    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return res.status(400).json({
        success: false,
        message: "Date range cannot exceed 90 days",
      });
    }


    const bookings = await Booking.find({
      roomId,
      status: { $in: ["pending", "booked"] },
      $or: [
        { checkIn: { $lte: end }, checkOut: { $gte: start } },
      ],
    }).select("checkIn checkOut status totalGuest");


    const calendar = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

     
      const bookedCount = bookings.filter((booking) => {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);

        return currentDate >= bookingStart && currentDate < bookingEnd;
      }).length;

      const availableRooms = room.totalRooms - bookedCount;

      calendar.push({
        date: dateStr,
        dayOfWeek: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        totalRooms: room.totalRooms,
        bookedRooms: bookedCount,
        availableRooms: Math.max(0, availableRooms),
        isAvailable: availableRooms > 0,
        occupancyRate: ((bookedCount / room.totalRooms) * 100).toFixed(0),
        pricePerDay: room.pricePerDay,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      message: "Room availability calendar fetched",
      room: {
        id: room._id,
        title: room.title,
        roomType: room.roomType,
        totalRooms: room.totalRooms,
        maxGuests: room.maxGuests,
      },
      dateRange: {
        start: startDate,
        end: endDate,
        days: daysDiff,
      },
      calendar,
    });
  } catch (error) {
    console.error("Room availability calendar error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🏨 2. Get Hotel Availability Calendar (All Rooms)
export const getHotelAvailabilityCalendar = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Get hotel and all rooms
    const [hotel, rooms] = await Promise.all([
      Hotel.findById(hotelId),
      Room.find({ hotelId }),
    ]);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No rooms found for this hotel",
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return res.status(400).json({
        success: false,
        message: "Date range cannot exceed 90 days",
      });
    }

    // Get all bookings for this hotel in date range
    const roomIds = rooms.map((r) => r._id);
    const bookings = await Booking.find({
      roomId: { $in: roomIds },
      status: { $in: ["pending", "booked"] },
      $or: [{ checkIn: { $lte: end }, checkOut: { $gte: start } }],
    });

    // Calculate total capacity
    const totalRoomsCount = rooms.reduce((sum, room) => sum + room.totalRooms, 0);

    // Build calendar
    const calendar = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      let totalBooked = 0;
      const roomAvailability = rooms.map((room) => {
        const bookedCount = bookings.filter((booking) => {
          if (booking.roomId.toString() !== room._id.toString()) return false;

          const bookingStart = new Date(booking.checkIn);
          const bookingEnd = new Date(booking.checkOut);
          bookingStart.setHours(0, 0, 0, 0);
          bookingEnd.setHours(0, 0, 0, 0);

          return currentDate >= bookingStart && currentDate < bookingEnd;
        }).length;

        totalBooked += bookedCount;

        return {
          roomId: room._id,
          roomType: room.roomType,
          title: room.title,
          totalRooms: room.totalRooms,
          bookedRooms: bookedCount,
          availableRooms: room.totalRooms - bookedCount,
        };
      });

      const totalAvailable = totalRoomsCount - totalBooked;

      calendar.push({
        date: dateStr,
        dayOfWeek: currentDate.toLocaleDateString("en-IN", { weekday: "short" }),
        totalRooms: totalRoomsCount,
        bookedRooms: totalBooked,
        availableRooms: totalAvailable,
        occupancyRate: ((totalBooked / totalRoomsCount) * 100).toFixed(0),
        isFullyBooked: totalAvailable === 0,
        roomBreakdown: roomAvailability,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      message: "Hotel availability calendar fetched",
      hotel: {
        id: hotel._id,
        name: hotel.name,
        city: hotel.city,
        totalRooms: totalRoomsCount,
      },
      dateRange: {
        start: checkIn,
        end: checkOut,
        days: daysDiff,
      },
      calendar,
    });
  } catch (error) {
    console.error("Hotel availability calendar error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 📊 3. Get Month View Calendar
export const getMonthViewCalendar = async (req, res) => {
  try {
    const { roomId, year, month } = req.query;

    if (!roomId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: "Room ID, year, and month are required",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Get first and last day of month
    const firstDay = new Date(Number(year), Number(month) - 1, 1);
    const lastDay = new Date(Number(year), Number(month), 0);

    // Get bookings for the month
    const bookings = await Booking.find({
      roomId,
      status: { $in: ["pending", "booked"] },
      $or: [
        { checkIn: { $lte: lastDay }, checkOut: { $gte: firstDay } },
      ],
    }).populate("userId", "name email");

    // Build calendar grid (including prev/next month days for full weeks)
    const startDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const calendarGrid = [];
    let currentDate = new Date(firstDay);
    currentDate.setDate(currentDate.getDate() - startDay); // Start from Sunday

    // Generate 6 weeks (42 days) to cover all possibilities
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const isCurrentMonth = currentDate.getMonth() === Number(month) - 1;

      // Count bookings for this date
      const dayBookings = bookings.filter((booking) => {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        const checkDate = new Date(currentDate);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= bookingStart && checkDate < bookingEnd;
      });

      const bookedCount = dayBookings.length;
      const availableRooms = room.totalRooms - bookedCount;

      calendarGrid.push({
        date: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth,
        dayOfWeek: currentDate.getDay(),
        totalRooms: room.totalRooms,
        bookedRooms: bookedCount,
        availableRooms,
        isFullyBooked: availableRooms === 0,
        bookings: isCurrentMonth ? dayBookings.map(b => ({
          id: b._id,
          guestName: b.userId?.name || "Guest",
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
        })) : [],
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Format into weeks
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(calendarGrid.slice(i * 7, (i + 1) * 7));
    }

    return res.status(200).json({
      success: true,
      message: "Month view calendar fetched",
      room: {
        id: room._id,
        title: room.title,
        totalRooms: room.totalRooms,
      },
      month: {
        year: Number(year),
        month: Number(month),
        name: new Date(year, month - 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        firstDay: firstDay.toISOString().split("T")[0],
        lastDay: lastDay.toISOString().split("T")[0],
        daysInMonth,
      },
      weeks,
    });
  } catch (error) {
    console.error("Month view calendar error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ⚡ 4. Quick Availability Check (Specific Dates)
export const quickAvailabilityCheck = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Room ID, check-in, and check-out dates are required",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in",
      });
    }

    // Count overlapping bookings
    const bookedCount = await Booking.countDocuments({
      roomId,
      status: { $in: ["pending", "booked"] },
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    });

    const availableRooms = room.totalRooms - bookedCount;
    const isAvailable = availableRooms > 0;

    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = room.pricePerDay * nights;

    return res.status(200).json({
      success: true,
      message: isAvailable ? "Rooms available" : "No rooms available",
      availability: {
        isAvailable,
        totalRooms: room.totalRooms,
        bookedRooms: bookedCount,
        availableRooms: Math.max(0, availableRooms),
        checkIn,
        checkOut,
        nights,
        pricePerNight: room.pricePerDay,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Quick availability check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔔 5. Get Booking Details for Calendar Date
export const getDateBookingDetails = async (req, res) => {
  try {
    const { roomId, date } = req.query;

    if (!roomId || !date) {
      return res.status(400).json({
        success: false,
        message: "Room ID and date are required",
      });
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get bookings that include this date
    const bookings = await Booking.find({
      roomId,
      status: { $in: ["pending", "booked"] },
      checkIn: { $lt: nextDay },
      checkOut: { $gt: selectedDate },
    })
      .populate("userId", "name email mobileNumber")
      .populate("hotelId", "name city")
      .sort({ checkIn: 1 });

    return res.status(200).json({
      success: true,
      message: "Date booking details fetched",
      date,
      bookings: bookings.map((b) => ({
        id: b._id,
        guest: {
          name: b.userId?.name || "Guest",
          email: b.userId?.email,
          phone: b.userId?.mobileNumber,
        },
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalGuest: b.totalGuest,
        totalPrice: b.totalPrice,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentMode: b.paymentMode,
      })),
    });
  } catch (error) {
    console.error("Date booking details error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 📈 6. Availability Forecast (Next 30 Days)
export const getAvailabilityForecast = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const rooms = await Room.find({ hotelId });
    const totalCapacity = rooms.reduce((sum, r) => sum + r.totalRooms, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    // Get all future bookings
    const bookings = await Booking.find({
      hotelId,
      status: { $in: ["pending", "booked"] },
      checkIn: { $lt: next30Days },
      checkOut: { $gt: today },
    });

    // Calculate forecast day by day
    const forecast = [];
    const currentDate = new Date(today);

    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const bookedCount = bookings.filter((booking) => {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);

        return currentDate >= bookingStart && currentDate < bookingEnd;
      }).length;

      const availableRooms = totalCapacity - bookedCount;
      const occupancyRate = (bookedCount / totalCapacity) * 100;

      let status = "low";
      if (occupancyRate >= 90) status = "full";
      else if (occupancyRate >= 70) status = "high";
      else if (occupancyRate >= 40) status = "medium";

      forecast.push({
        date: dateStr,
        dayOfWeek: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        totalRooms: totalCapacity,
        bookedRooms: bookedCount,
        availableRooms,
        occupancyRate: occupancyRate.toFixed(0),
        status,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      message: "Availability forecast fetched",
      hotel: {
        id: hotel._id,
        name: hotel.name,
        totalRooms: totalCapacity,
      },
      forecast,
    });
  } catch (error) {
    console.error("Availability forecast error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};