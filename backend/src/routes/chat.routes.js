import express from "express";
import {
  sseController,
  sendMessage,
  getChatMessages,
  markMessagesAsSeen,
} from "../controllers/chat.controllers.js";

import { protect } from "../middelwares/auth.js";

const chatRouter = express.Router();


chatRouter.get(
  "/sse/:userId",
  sseController
);


chatRouter.post(
  "/:hotelId",
  protect,
  sendMessage
);


chatRouter.get(
  "/:hotelId",
  protect,
  getChatMessages
);


chatRouter.patch(
  "/seen/:hotelId",
  protect,
  markMessagesAsSeen
);

export default chatRouter;
