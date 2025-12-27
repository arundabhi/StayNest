import express from 'express'

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


dotenv.config({
    path: './.env'
})

const app = express()
const port = process.env.PORT || 5000

connectDb();


app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));


app.use('/api/user',userRouter)
app.use('/api/admin',adminRouter)
app.use('/api/auth',authRouter)
app.use('/api/hotel',hotelRouter)
app.use('/api/room',roomRouter)
app.use('/api/booking',bookingRouter)
app.use('/api/waitlist',waitlistRouter)
app.use('/api/wishlist',wishlistRouter)
app.use('/api/review',reviewRouter)
app.use('/api/chat',chatRouter)
app.use('/api/payment',paymentRouter2)
app.use('/api/coupon',couponRouter)
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytic', analyticRouter);
app.use('/api/availability', availabilityRouter);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
