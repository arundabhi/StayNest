import express from "express";
import {
  createRoom,
  updateRoom,
  updateRoomImages,
  deleteRoom,
  getRoomsByHotel,
  getRoomById,
  toggleRoomAvailability,
  checkRoomAvailability,
  getRoomStats,
  searchRooms,
} from "../controllers/room.controllers.js";

import { protect } from "../middelwares/auth.js";
import upload from "../middelwares/multer.js";

const roomRouter = express.Router();

roomRouter.post(
  "/hotel/:hotelId",
  protect,
  upload.array("images", 5),
  createRoom
);


roomRouter.put(
  "/:hotelId/:roomId",
  protect,
  updateRoom
);

roomRouter.put(
  "/:hotelId/:roomId/images",
  protect,
  upload.array("images", 5),
  updateRoomImages
);


roomRouter.delete(
  "/:hotelId/:roomId",
  protect,
  deleteRoom
);


roomRouter.patch(
  "/:hotelId/:roomId/toggle-availability",
  protect,
  toggleRoomAvailability
);


roomRouter.get(
  "/:hotelId/:roomId/stats",
  protect,
  getRoomStats
);


roomRouter.get(
  "/hotel/:hotelId",
  getRoomsByHotel
);


roomRouter.get(
  "/:roomId",
  getRoomById
);


roomRouter.post(
  "/:roomId/check-availability",
  checkRoomAvailability
);
roomRouter.get("/search", searchRooms);
export default roomRouter;
