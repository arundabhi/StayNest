import express from 'express'
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';

import dotenv from "dotenv"
import cors from 'cors'
import connectDb from './db/index.js'
import './cron/booking.cron.js'

import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import authRouter from './routes/auth.routes.js';
import hotelRouter from './routes/hotel.routes.js';
import roomRouter from './routes/room.routes.js';
import bookingRouter from './routes/booking.routes.js';
import waitlistRouter from './routes/waitlist.routes.js';
import wishlistRouter from './routes/wishlist.router.js';
import reviewRouter from './routes/review.routes.js';
import chatRouter from './routes/chat.routes.js';
import paymentRouter2 from './routes/payment.routes.js'
import couponRouter from './routes/coupone.routes.js'
import recommendationRoutes from './routes/recommendation.routes.js'
import analyticRouter from './routes/analytic.routes.js'
import availabilityRouter from './routes/availability.routes.js'
import { apiLimiter } from './middelwares/rateLimiter.js'


dotenv.config({
    path: './.env'
})

const app = express()
const port = process.env.PORT || 5000

connectDb();


app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent MongoDB injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/v1/users',userRouter)
app.use('/api/v1/admin',adminRouter)
app.use('/api/v1/auth',authRouter)
app.use('/api/v1/hotels',hotelRouter)
app.use('/api/v1/rooms',roomRouter)
app.use('/api/v1/bookings',bookingRouter)
app.use('/api/v1/waitlists',waitlistRouter)
app.use('/api/v1/wishlists',wishlistRouter)
app.use('/api/v1/reviews',reviewRouter)
app.use('/api/v1/chats',chatRouter)
app.use('/api/v1/payment',paymentRouter2)
app.use('/api/v1/coupones',couponRouter)
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/analytics', analyticRouter);
app.use('/api/v1/availability', availabilityRouter);
app.use('/api/v1/', apiLimiter);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
