import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'
import dotenv from 'dotenv'
dotenv.config()

const connectDB = async () => {
    try{
        console.log(process.env.DB_URL)
        const connectionInstance = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        console.log(connectionInstance.connection.host);
    }
    catch(err){
        console.log("Error in Connecting DB : ", err);
        throw err;
    }
}

export default connectDB;