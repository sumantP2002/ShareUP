import mongoose from 'mongoose'
import { DB_NAME } from '../constants'

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        console.log(connectionInstance);
    }
    catch(err){
        console.log("Error in Connecting DB : ", err);
        throw err;
    }
}

export default connectDB;