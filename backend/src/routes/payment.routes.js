import express from "express";
import { confirmRazorpayBooking, createRazorpayOrder, paymentOnCOD, paymentOnStripe, verifyRazorpayPayment, verifyStripePayment } from "../controllers/payment.controllers.js";
import { protect } from "../middelwares/auth.js";



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

// Verify Razorpay payment
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


export default paymentRouter2;
