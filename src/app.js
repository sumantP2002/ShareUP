import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()


//TO define cross origin paramenter
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

//to handle json data and allow it to come to backend
app.use(express.json({
    limit: "16kb"
}))

//this is to allow server to access cookies of client
app.use(cookieParser())

//this is to handle data when it is in url form
app.use(express.urlencoded({extended: true}))

//this allow to store data on local system
app.use(express.static("public"))

//routing info


export {app}
