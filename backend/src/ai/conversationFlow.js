// // ai/conversationFlow.js
// import { Hotel } from "../models/hotel.models.js";
// import { Room } from "../models/room.models.js";
// import { Booking } from "../models/booking.models.js";

// // Session storage for conversation state
// const sessions = new Map();

// export class ConversationFlow {
//   constructor(userId) {
//     this.userId = userId;
    
//     // Initialize or get existing session
//     if (!sessions.has(userId)) {
//       sessions.set(userId, {
//         state: "IDLE",
//         context: {},
//         history: [],
//       });
//     }
    
//     this.session = sessions.get(userId);
//   }

//   // Get current state
//   getState() {
//     return this.session.state;
//   }

//   // Update state
//   setState(newState) {
//     this.session.state = newState;
//     console.log(`[FLOW] User ${this.userId}: ${newState}`);
//   }

//   // Save context
//   setContext(key, value) {
//     this.session.context[key] = value;
//   }

//   // Get context
//   getContext(key) {
//     return this.session.context[key];
//   }

//   // Clear context
//   clearContext() {
//     this.session.context = {};
//   }

//   // Add to history
//   addToHistory(userMessage, botResponse) {
//     this.session.history.push({
//       user: userMessage,
//       bot: botResponse,
//       timestamp: new Date(),
//     });

//     // Keep only last 10 exchanges
//     if (this.session.history.length > 10) {
//       this.session.history.shift();
//     }
//   }

//   // Reset session
//   reset() {
//     this.session.state = "IDLE";
//     this.session.context = {};
//   }

//   // ==========================================
//   // BOOKING FLOW HANDLERS
//   // ==========================================

//   async handleSearchHotels(city) {
//     try {
//       const hotels = await Hotel.find({
//         $or: [
//           { city: { $regex: city, $options: "i" } },
//           { name: { $regex: city, $options: "i" } },
//         ],
//         isActive: true,
//         isApproved: true,
//       })
//         .select("name city basePrice amenities avgRating totalReviews")
//         .limit(5)
//         .sort({ avgRating: -1 });

//       if (hotels.length === 0) {
//         this.setState("IDLE");
//         return {
//           message: `Sorry, I couldn't find any hotels in "${city}". Try searching in another city like Mumbai, Delhi, Bangalore, or Ahmedabad.`,
//           hotels: [],
//         };
//       }

//       // Save hotels to context
//       this.setContext("hotels", hotels);
//       this.setContext("searchCity", city);
//       this.setState("HOTEL_SELECTION");

//       const hotelList = hotels
//         .map(
//           (h, i) =>
//             `${i + 1}. **${h.name}** - ${h.city}\n   💰 ₹${h.basePrice}/night | ⭐ ${h.avgRating || "New"} (${h.totalReviews || 0} reviews)`
//         )
//         .join("\n\n");

//       return {
//         message: `Great! I found ${hotels.length} hotel(s) in ${city}:\n\n${hotelList}\n\n👉 **Reply with a number (1-${hotels.length}) to select a hotel**`,
//         hotels,
//       };
//     } catch (error) {
//       console.error("Search error:", error);
//       this.setState("IDLE");
//       return {
//         message: "Sorry, I encountered an error while searching. Please try again.",
//         hotels: [],
//       };
//     }
//   }

//   async handleHotelSelection(selection) {
//     const hotels = this.getContext("hotels");

//     if (!hotels || hotels.length === 0) {
//       this.setState("IDLE");
//       return {
//         message: "⚠️ Please search for hotels first by saying 'Find hotels in [city]'",
//       };
//     }

//     const index = parseInt(selection) - 1;

//     if (isNaN(index) || index < 0 || index >= hotels.length) {
//       return {
//         message: `❌ Invalid selection. Please choose a number between 1 and ${hotels.length}.`,
//       };
//     }

//     const selectedHotel = hotels[index];

//     // Save to context
//     this.setContext("selectedHotel", selectedHotel);
//     this.setState("ROOM_SELECTION");

//     // Fetch rooms
//     const rooms = await Room.find({
//       hotelId: selectedHotel._id,
//       isAvailable: true,
//     })
//       .select("title roomType pricePerDay maxGuests amenities totalRooms")
//       .limit(5);

//     if (rooms.length === 0) {
//       this.setState("IDLE");
//       return {
//         message: `😔 Sorry, **${selectedHotel.name}** has no available rooms right now. Please select another hotel.`,
//       };
//     }

//     this.setContext("rooms", rooms);

//     const roomList = rooms
//       .map(
//         (r, i) =>
//           `${i + 1}. **${r.title}** (${r.roomType})\n   💰 ₹${r.pricePerDay}/night | 👥 Up to ${r.maxGuests} guests | 🛏️ ${r.totalRooms} available`
//       )
//       .join("\n\n");

//     return {
//       message: `✅ You selected **${selectedHotel.name}** in ${selectedHotel.city}\n\n📋 Available Rooms:\n\n${roomList}\n\n👉 **Reply with a number (1-${rooms.length}) to select a room**`,
//       hotel: selectedHotel,
//       rooms,
//     };
//   }

//   async handleRoomSelection(selection) {
//     const rooms = this.getContext("rooms");

//     if (!rooms || rooms.length === 0) {
//       this.setState("HOTEL_SELECTION");
//       return {
//         message: "⚠️ Please select a hotel first.",
//       };
//     }

//     const index = parseInt(selection) - 1;

//     if (isNaN(index) || index < 0 || index >= rooms.length) {
//       return {
//         message: `❌ Invalid selection. Please choose a number between 1 and ${rooms.length}.`,
//       };
//     }

//     const selectedRoom = rooms[index];
//     const selectedHotel = this.getContext("selectedHotel");

//     this.setContext("selectedRoom", selectedRoom);
//     this.setState("DATE_INPUT");

//     return {
//       message: `🛏️ You selected **${selectedRoom.title}** at **${selectedHotel.name}**\n\n📅 **Next step:** Please provide your check-in and check-out dates.\n\nFormat: \`Check-in: YYYY-MM-DD, Check-out: YYYY-MM-DD\`\n\nExample: \`Check-in: 2024-12-25, Check-out: 2024-12-28\``,
//       room: selectedRoom,
//       hotel: selectedHotel,
//     };
//   }

//   async handleDateInput(message) {
//     try {
//       // Parse dates from message
//       const checkInMatch = message.match(/check-?in:?\s*(\d{4}-\d{2}-\d{2})/i);
//       const checkOutMatch = message.match(/check-?out:?\s*(\d{4}-\d{2}-\d{2})/i);

//       if (!checkInMatch || !checkOutMatch) {
//         return {
//           message: "❌ I couldn't understand the dates. Please use this format:\n\n`Check-in: 2024-12-25, Check-out: 2024-12-28`",
//         };
//       }

//       const checkIn = new Date(checkInMatch[1]);
//       const checkOut = new Date(checkOutMatch[1]);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       // Validation
//       if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
//         return {
//           message: "❌ Invalid date format. Use YYYY-MM-DD (e.g., 2024-12-25)",
//         };
//       }

//       if (checkIn < today) {
//         return {
//           message: "❌ Check-in date cannot be in the past. Please provide future dates.",
//         };
//       }

//       if (checkOut <= checkIn) {
//         return {
//           message: "❌ Check-out must be after check-in. Please provide valid dates.",
//         };
//       }

//       const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

//       if (nights > 30) {
//         return {
//           message: "❌ Maximum stay is 30 nights. Please adjust your dates.",
//         };
//       }

//       // Save dates
//       this.setContext("checkIn", checkInMatch[1]);
//       this.setContext("checkOut", checkOutMatch[1]);
//       this.setContext("nights", nights);

//       const selectedRoom = this.getContext("selectedRoom");
//       const totalPrice = selectedRoom.pricePerDay * nights;

//       this.setState("GUEST_COUNT");

//       return {
//         message: `📅 Great! Your stay:\n\n✅ Check-in: ${checkInMatch[1]}\n✅ Check-out: ${checkOutMatch[1]}\n✅ Duration: ${nights} night(s)\n💰 Estimated cost: ₹${totalPrice}\n\n👥 **How many guests?** (Max ${selectedRoom.maxGuests})`,
//         checkIn: checkInMatch[1],
//         checkOut: checkOutMatch[1],
//         nights,
//         totalPrice,
//       };
//     } catch (error) {
//       console.error("Date parsing error:", error);
//       return {
//         message: "❌ Error processing dates. Please try again with format: Check-in: YYYY-MM-DD, Check-out: YYYY-MM-DD",
//       };
//     }
//   }

//   async handleGuestCount(message) {
//     const guestMatch = message.match(/\d+/);

//     if (!guestMatch) {
//       return {
//         message: "❌ Please provide the number of guests (e.g., 2)",
//       };
//     }

//     const guestCount = parseInt(guestMatch[0]);
//     const selectedRoom = this.getContext("selectedRoom");

//     if (guestCount < 1) {
//       return {
//         message: "❌ At least 1 guest is required.",
//       };
//     }

//     if (guestCount > selectedRoom.maxGuests) {
//       return {
//         message: `❌ This room can accommodate maximum ${selectedRoom.maxGuests} guests. Please choose a different room or reduce guest count.`,
//       };
//     }

//     this.setContext("guestCount", guestCount);
//     this.setState("PAYMENT_METHOD");

//     const selectedHotel = this.getContext("selectedHotel");
//     const checkIn = this.getContext("checkIn");
//     const checkOut = this.getContext("checkOut");
//     const nights = this.getContext("nights");
//     const totalPrice = selectedRoom.pricePerDay * nights;

//     return {
//       message: `📋 **Booking Summary:**\n\n🏨 Hotel: ${selectedHotel.name}, ${selectedHotel.city}\n🛏️ Room: ${selectedRoom.title}\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n🌙 Nights: ${nights}\n👥 Guests: ${guestCount}\n💰 Total: ₹${totalPrice}\n\n💳 **Choose payment method:**\n\n1. 💳 **STRIPE** (Card payment)\n2. 💰 **RAZORPAY** (UPI/Cards)\n3. 🏨 **Pay at Hotel** (Cash on arrival)\n\n👉 Reply with number (1, 2, or 3)`,
//       summary: {
//         hotel: selectedHotel.name,
//         room: selectedRoom.title,
//         checkIn,
//         checkOut,
//         nights,
//         guests: guestCount,
//         totalPrice,
//       },
//     };
//   }

//   async handlePaymentMethod(selection) {
//     const paymentMethods = {
//       1: { name: "STRIPE", display: "Stripe" },
//       2: { name: "RAZORPAY", display: "Razorpay" },
//       3: { name: "COD", display: "Pay at Hotel" },
//     };

//     const choice = parseInt(selection);

//     if (!paymentMethods[choice]) {
//       return {
//         message: "❌ Invalid choice. Please select 1 (Stripe), 2 (Razorpay), or 3 (Pay at Hotel).",
//       };
//     }

//     const paymentMethod = paymentMethods[choice];
//     this.setContext("paymentMethod", paymentMethod.name);
//     this.setState("CONFIRMATION");

//     return {
//       message: `✅ Payment method: **${paymentMethod.display}**\n\n🎯 **Type 'CONFIRM' to complete your booking** or 'CANCEL' to start over.`,
//       paymentMethod: paymentMethod.name,
//     };
//   }

//   async handleConfirmation(userId) {
//     try {
//       const hotel = this.getContext("selectedHotel");
//       const room = this.getContext("selectedRoom");
//       const checkIn = this.getContext("checkIn");
//       const checkOut = this.getContext("checkOut");
//       const guestCount = this.getContext("guestCount");
//       const paymentMethod = this.getContext("paymentMethod");
//       const nights = this.getContext("nights");

//       // Create booking
//       const totalPrice = room.pricePerDay * nights;

//       const booking = await Booking.create({
//         userId,
//         hotelId: hotel._id,
//         roomId: room._id,
//         checkIn: new Date(checkIn),
//         checkOut: new Date(checkOut),
//         totalGuest: guestCount,
//         paymentMode: paymentMethod,
//         totalPrice,
//         status: "pending",
//         paymentStatus: "pending",
//       });

//       // Reset session
//       this.reset();

      

//       if (paymentMethod === "COD") {
//         return {
//           message: `🎉 **Booking Confirmed!**\n\n✅ Booking ID: \`${booking._id}\`\n🏨 ${hotel.name}\n📅 ${checkIn} to ${checkOut}\n💰 Total: ₹${totalPrice}\n\n✅ Payment: **Pay at Hotel**\n\n📌 **Important:** Please show this booking ID at hotel reception during check-in.\n\nHave a great stay! 🌟`,
//           bookingId: booking._id,
//           success: true,
//         };
//       } else {
//         const paymentUrl = `${process.env.FRONTEND_URL}/payment/${booking._id}?method=${paymentMethod}`;

//         return {
//           message: `🎉 **Booking Created!**\n\n✅ Booking ID: \`${booking._id}\`\n🏨 ${hotel.name}\n📅 ${checkIn} to ${checkOut}\n💰 Total: ₹${totalPrice}\n\n💳 **Next Step:** Complete your payment\n\n🔗 Payment Link: ${paymentUrl}\n\n⚠️ Your booking will be confirmed after payment.`,
//           bookingId: booking._id,
//           paymentUrl,
//           requiresPayment: true,
//           success: true,
//         };
//       }
//     } catch (error) {
//       console.error("Booking creation error:", error);
//       this.setState("IDLE");
//       return {
//         message: "❌ Sorry, there was an error creating your booking. Please try again or contact support.",
//         success: false,
//       };
//     }
//   }

//   // Cancel current flow
//   handleCancel() {
//     this.reset();
//     return {
//       message: "🔄 Booking cancelled. You can start a new search anytime!",
//     };
//   }
// }

// // Helper to get or create flow
// export const getConversationFlow = (userId) => {
//   return new ConversationFlow(userId);
// };

// // Clear all sessions (for debugging)
// export const clearAllSessions = () => {
//   sessions.clear();
//   console.log("All conversation sessions cleared");
// };