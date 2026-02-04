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
    const { message, sender } = req.body;

    if (!senderId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (!hotelId || !message || !sender) {
      return res.status(400).json({
        success: false,
        message: "hotelId, message and sender are required",
      });
    }

  
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const chat = await Chat.create({
      userId: senderId,
      hotelId,
      sender,
      message,
      status: "sent",
    });


    const receiverId =
      sender === "user"
        ? hotel.owner.toString() 
        : senderId;             

    if (connections[receiverId]) {
      connections[receiverId].forEach(stream => {
        stream.write(
          `data: ${JSON.stringify({ type: "new-message", chat })}\n\n`
        );
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message sent",
      chat,
    });

  } catch (error) {
    console.error("send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const page = Number(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [messages, totalMessages] = await Promise.all([
      Chat.find({ userId, hotelId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit).populate("userId", "name email").populate("hotelId",'name city'),

      Chat.countDocuments({ userId, hotelId }),
    ]);

    const hotelInfo = messages.length > 0 ? messages[0].hotelId : null



    return res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
      },
      hotel:hotelInfo,
      messages 
    });

  } catch (error) {
    console.error("get chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const markMessagesAsSeen = async (req, res) => {
  try {
    const userId = req.userId;
    const { hotelId } = req.params;

    await Chat.updateMany(
      { userId, hotelId, sender: "hotel", status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    if (connections[userId]) {
      connections[userId].forEach(stream => {
        stream.write(
          `data: ${JSON.stringify({ type: "seen" })}\n\n`
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: "Messages marked as seen",
    });

  } catch (error) {
    console.error("mark seen error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
