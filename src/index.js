import { app } from "./app.js";
import dotenv from 'dotenv'
import connectDB from "./db/db.js";
dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running at PORT : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection Failed");
})