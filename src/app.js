import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

app.use(cookieParser())

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({extended: true}))

app.use(express.static('public'));

//import routes
import userRoute from './routes/user.routes.js'
app.use("/api/v1/users", userRoute);

export { app }
