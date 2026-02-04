import express from "express";
import { confirmRazorpayBooking, createRazorpayOrder, getHotelPayments, getMyPayments, paymentOnCOD, paymentOnStripe, verifyRazorpayPayment, verifyStripePayment } from "../controllers/payment.controllers.js";
import { protect } from "../middelwares/auth.js";
import { authorizeRoles } from "../middelwares/role.js";



const paymentRouter2 = express.Router()

paymentRouter2.post(
  "/cod/:bookingId",
  protect,
  paymentOnCOD
);


paymentRouter2.get(
  "/stripe/verify",
  protect,
  verifyStripePayment
);


paymentRouter2.post(
  "/razorpay/verify",
  protect,
  verifyRazorpayPayment
);
paymentRouter2.post(
  "/stripe/:bookingId",
  protect,
  paymentOnStripe
);



paymentRouter2.post(
  "/razorpay/:bookingId",
  protect,
  createRazorpayOrder
);
paymentRouter2.patch(
  "/razorpay/confirm/:bookingId",
  protect,
  confirmRazorpayBooking
);

paymentRouter2.get(
  "/my",
  protect,
  getMyPayments
);

paymentRouter2.get(
  "/hotel",
  protect,
  authorizeRoles("owner", "admin"),
  getHotelPayments
);




export default paymentRouter2;
