import rateLimit from 'express-rate-limit';


export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  skipSuccessfulRequests: true, 
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 3, 
  message: {
    success: false,
    message: "Too many payment attempts, please wait",
  },
});


export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  message: {
    success: false,
    message: "Too many email requests, please try again later",
  },
});