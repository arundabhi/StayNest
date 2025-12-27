import express from "express";
import { createRazorpayOrder, paymentOnCOD, paymentOnStripe, verifyRazorpayPayment, verifyStripePayment } from "../controllers/payment.controllers.js";
import { protect } from "../middelwares/auth.js";



const paymentRouter2 = express.Router()

paymentRouter2.post(
  "/cod/:bookingId",
  protect,
  paymentOnCOD
);

paymentRouter2.get('/a',()=>"Hello")


paymentRouter2.post(
  "/stripe/:bookingId",
  protect,
  paymentOnStripe
);

paymentRouter2.get(
  "/stripe/verify",
  verifyStripePayment
);


paymentRouter2.post(
  "/razorpay/:bookingId",
  protect,
  createRazorpayOrder
);

// Verify Razorpay payment
paymentRouter2.post(
  "/razorpay/verify",
  protect,
  verifyRazorpayPayment
);

export default paymentRouter2;
