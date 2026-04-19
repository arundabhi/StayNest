import dotenv from "dotenv";
import app from "./src/app.js";
import connectDb from "./src/db/index.js";
import './src/api/cron/cleanup.js'

dotenv.config({ path: "./.env" });

const port = process.env.PORT || 3000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!! ", err);
  });
