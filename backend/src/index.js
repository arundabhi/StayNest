import express from 'express'
import dotenv from "dotenv"
import cors from 'cors'
import connectDb from './db/index.js'
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import authRouter from './routes/auth.routes.js';
import hotelRouter from './routes/hotel.routes.js';

dotenv.config({
    path: './.env'
})

const app = express()
const port = 3000

connectDb();


app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use('/api/user',userRouter)
app.use('/api/admin',adminRouter)
app.use('/api/auth',authRouter)
app.use('/api/hotel',hotelRouter)


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
