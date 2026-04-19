import { Chat } from "../models/chat.models.js";
import { Hotel } from "../models/hotel.models.js";

const connections = {};

export const sseController = (req, res) => {
  const { userId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!connections[userId]) {
    connections[userId] = [];
  }

  connections[userId].push(res);

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => {
    connections[userId] = connections[userId].filter(r => r !== res);
    if (connections[userId].length === 0) {
      delete connections[userId];
    }
  });
};



export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { hotelId } = req.params;
    const { message, sender, recipientId } = req.body;

    if (!hotelId || !message || !sender) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    let guestId;

    if (sender === "user") {
      guestId = senderId;
    } else {
      guestId = recipientId;
    }

    const chat = await Chat.create({
      hotelId,
      userId: guestId,
      sender,
      message,
      status: "sent"
    });

    // decide who receives SSE
    const receiverId = sender === "user" ? hotel.owner.toString(): guestId;

    if (connections[receiverId]) {
      connections[receiverId].forEach(stream => {
        stream.write(
          `data: ${JSON.stringify({ type: "new-message", chat })}\n\n`
        );
      });
    }

    res.status(201).json({ success: true, chat });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const getChatMessages = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.userId;

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    let query;

    // If logged in user is owner
    if (hotel.owner.toString() === userId.toString()) {
      query = { hotelId }; // get ALL chats
    } else {
      // guest side
      query = { hotelId, userId };
    }

    const messages = await Chat.find(query)
      .sort({ createdAt: 1 })
      .populate("userId", "name email")
      .populate("hotelId", "name city");

    const hotelData = messages.length > 0
      ? messages[0].hotelId
      : await Hotel.findById(req.params.hotelId).select("name city");

    return res.status(200).json({
      success: true,
      messages,
      hotelData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const markMessagesAsSeen = async (req, res) => {
  try {
    const loggedInUserId = req.userId;
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId);
    let query;
    let notifyUsers = [];

    if (hotel.owner.toString() === loggedInUserId.toString()) {
      // Owner viewing → mark user messages seen
      query = { hotelId, sender: "user", status: { $ne: "seen" } };

      // Notify guest
      const chats = await Chat.find(query);
      notifyUsers = [...new Set(chats.map(c => c.userId.toString()))];

      console.log("Notify Users:", notifyUsers);

    } else {
      // Guest viewing → mark hotel messages seen
      query = {
        hotelId,
        userId: loggedInUserId,
        sender: "hotel",
        status: { $ne: "seen" }
      };

      notifyUsers = [hotel.owner.toString()];
    }

    await Chat.updateMany(query, { $set: { status: "seen" } });

    // 🔥 Notify all affected users
    notifyUsers.forEach(uid => {
      if (connections[uid]) {
        connections[uid].forEach(stream => {
          stream.write(
            `data: ${JSON.stringify({ type: "seen" })}\n\n`
          );
        });
      }
    });

    return res.json({ success: true });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
